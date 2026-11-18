const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { validateContact, validatePartnershipRequest, validateNewsletter, validateRegistration, validatePasswordChange, validateService, validateProject, validatePartner } = require("./validation");
const { validateInquiry, validateCartInquiry, validateQuote } = require("./inquiryValidation");
const { publicNominationQuery, PUBLIC_FIELDS } = require("../utils/awardsPublic");
const { Contact, ProductInquiry, Nomination } = require("../models");

test("form validation accepts valid submissions and rejects invalid data without database writes", async () => {
  const app = express();
  app.use(express.json());
  for (const [name, validators] of Object.entries({ contact: validateContact, partnership: validatePartnershipRequest,
    newsletter: validateNewsletter, registration: validateRegistration, password: validatePasswordChange,
    service: validateService, project: validateProject, partner: validatePartner,
    inquiry: validateInquiry, cart: validateCartInquiry, quote: validateQuote })) {
    app.post(`/${name}`, validators, (req, res) => res.json({ success: true }));
  }
  app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const submit = async (route, body, expected = 200) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/${route}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${route}: ${JSON.stringify(result)}`);
  };
  const customer = { customerName: "Test Visitor", customerEmail: "visitor@example.com", preferredContact: "email" };
  try {
    await submit("contact", { name: "Anne O'Neil", email: "visitor@example.com", subject: "", phone: "", message: "Please contact me about a project." });
    await submit("contact", { name: "Visitor", email: "bad", message: "short" }, 400);
    await submit("partnership", { companyName: "Test Company", contactPerson: "Anne O'Neil", contactEmail: "visitor@example.com", website: "", description: "We would like to discuss a technology partnership." });
    await submit("partnership", { companyName: "Test Company", contactPerson: "Test Visitor", contactEmail: "visitor@example.com", website: "broken", description: "We would like to discuss a technology partnership." }, 400);
    await submit("newsletter", { email: "visitor@example.com" });
    await submit("newsletter", { email: "broken" }, 400);
    await submit("registration", { name: "Test Visitor", email: "visitor@example.com", password: "StrongPass1!", phone: "" });
    await submit("password", { currentPassword: "OldPass1!", newPassword: "StrongPass1!", confirmPassword: "StrongPass1!" });
    await submit("password", { currentPassword: "OldPass1!", newPassword: "weak", confirmPassword: "weak" }, 400);
    await submit("service", { title: "Test Service", description: "A valid service description.", icon: "X", category: "Web Development" });
    await submit("project", { title: "Test Project", description: "A valid project description.", category: "Web Application" });
    await submit("partner", { name: "Test Partner", website: "", description: "", isActive: "true", order: "0" });
    await submit("inquiry", { ...customer, productId: "507f1f77bcf86cd799439011", quantity: "3" });
    await submit("inquiry", { ...customer, productId: "bad", quantity: "0" }, 400);
    await submit("inquiry", { ...customer, productId: "507f1f77bcf86cd799439011", preferredContact: "phone" }, 400);
    await submit("cart", { ...customer, items: [{ productId: "507f1f77bcf86cd799439011", quantity: 2 }], message: "x".repeat(1000) });
    await submit("cart", { ...customer, items: [{ productId: "bad", quantity: -1 }] }, 400);
    await submit("quote", { ...customer, serviceId: "frontend-service", serviceName: "Web Development", budget: "Not sure", timeline: "Flexible" });
    await submit("quote", { ...customer, customerEmail: "bad", serviceId: "frontend-service", serviceName: "Web Development" }, 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("awards public queries cannot request pending nominees or disclose voter/contact data", () => {
  const { filter, sort, page, limit } = publicNominationQuery({ status: "pending", search: "[", country: "(", page: "-4", limit: "10000", sortBy: "publicVotes" });
  assert.deepEqual(filter.status, { $in: ["approved", "finalist", "winner"] });
  assert.equal(page, 1);
  assert.equal(limit, 100);
  assert.equal(sort.votes, -1);
  assert.equal(filter.$or[0].nomineeName.test("name [ here"), true);
  for (const privateField of ["publicVotes", "nominatorEmail", "nominatorPhone", "adminNotes", "nominatorName", "adminVotes", "voteAdjustments"]) {
    assert.equal(PUBLIC_FIELDS.split(" ").includes(privateField), false);
  }
  assert.throws(() => publicNominationQuery({ category: "invalid" }), /Invalid award category/);
  const publicNominee = Nomination.hydrate({ nomineeName: "Test Nominee", votes: 4 }, { nomineeName: 1, votes: 1 });
  assert.equal(publicNominee.toJSON().totalVotes, 4);
});

test("only admins can add votes; additions update the public count and retain a private audit record", async t => {
  const { adminMiddleware } = require("./auth");
  const { addAdminVotes, adminVoteValidation } = require("../controllers/awardVoteController");
  const app = express();
  app.use(express.json());
  // Simulate identities supplied by authentication; exercise the real role check.
  app.use((req, res, next) => {
    if (req.headers["x-test-role"]) req.user = { _id: "507f1f77bcf86cd799439012", role: req.headers["x-test-role"] };
    next();
  });
  app.post("/:id", adminMiddleware, adminVoteValidation, addAdminVotes);
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
  let writeCount = 0;
  t.mock.method(Nomination, "findByIdAndUpdate", (id, update) => {
    writeCount++;
    assert.equal(update.$inc.votes, 20);
    assert.equal(update.$inc.adminVotes, 20);
    assert.equal(update.$push.voteAdjustments.reason, "Launch encouragement");
    assert.equal(String(update.$push.voteAdjustments.addedBy), "507f1f77bcf86cd799439012");
    return { populate: async () => ({ _id: id, votes: 23, adminVotes: 20 }) };
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  async function submit(role, body, expected) {
    const result = await fetch(`http://127.0.0.1:${server.address().port}/507f1f77bcf86cd799439011`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(role ? { "x-test-role": role } : {}) }, body: JSON.stringify(body)
    });
    const data = await result.json();
    assert.equal(result.status, expected, JSON.stringify(data));
    return data;
  }
  try {
    const payload = { amount: 20, reason: "Launch encouragement" };
    await submit(null, payload, 401);
    await submit("user", payload, 403);
    await submit("admin", { amount: -1, reason: "Launch encouragement" }, 400);
    await submit("admin", { amount: 1.5, reason: "Launch encouragement" }, 400);
    await submit("admin", { amount: 20, reason: "" }, 400);
    const result = await submit("admin", payload, 200);
    assert.equal(result.data.nomination.votes, 23);
    assert.equal(writeCount, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("public votes and ordinary saves preserve admin vote additions", async t => {
  const nomination = new Nomination({ nomineeName: "Test Nominee", category: "507f1f77bcf86cd799439011", status: "approved", adminVotes: 20 });
  t.mock.method(Nomination, "findOneAndUpdate", async () => ({
    adminVotes: 20, votes: 21, publicVotes: [{ voterEmail: "visitor@example.com" }]
  }));
  await nomination.addVote({ voterEmail: "visitor@example.com" });
  assert.equal(nomination.totalVotes, 21);
  // Run real pre-save hooks without a database write.
  await new Promise((resolve, reject) => Nomination.schema.s.hooks.execPre("save", nomination, [], error => error ? reject(error) : resolve()));
  assert.equal(nomination.votes, 21);
  assert.equal(nomination.adminVotes, 20);
});

test("contact and product schemas preserve fields collected by their forms", () => {
  const contact = new Contact({ name: "Test Visitor", email: "visitor@example.com", subject: "A question", phone: "+256700000000", message: "x".repeat(2000) });
  assert.equal(contact.validateSync(), undefined);
  assert.equal(contact.subject, "A question");
  assert.equal(contact.phone, "+256700000000");
  const inquiry = new ProductInquiry({ product: "507f1f77bcf86cd799439011", productName: "Test Product", customerName: "Test Visitor", quantity: "3", customerEmail: "visitor@example.com" });
  assert.equal(inquiry.validateSync(), undefined);
  assert.equal(inquiry.customerName, "Test Visitor");
  assert.equal(inquiry.quantity, 3);
});

test("vote writes conditionally reject the same email and normalize whitespace", async t => {
  const nomination = new Nomination({ nomineeName: "Test Nominee", category: "507f1f77bcf86cd799439011", status: "approved" });
  t.mock.method(Nomination, "findOneAndUpdate", async (filter, update) => {
    assert.equal(filter.status, "approved");
    assert.equal(filter["publicVotes.voterEmail"].$ne, "visitor@example.com");
    assert.equal(update.$inc.votes, 1);
    assert.equal(update.$push.publicVotes.voterEmail, "visitor@example.com");
    return null;
  });
  await assert.rejects(nomination.addVote({ voterEmail: " Visitor@Example.com " }), /already voted/);
  nomination.publicVotes.push({ voterEmail: "visitor@example.com" });
  assert.equal(nomination.hasVoted(" Visitor@Example.com "), true);
});

test("contact and order controllers save the submitted subject, phone, name and quantity", async t => {
  // Keep notification services inert: this test must never send email or WhatsApp.
  const servicePaths = ["../services/emailService", "../services/whatsappBaileysService"];
  const originalEntries = servicePaths.map(name => require.cache[require.resolve(name)]);
  for (const name of servicePaths) {
    const id = require.resolve(name);
    require.cache[id] = { id, filename: id, loaded: true, exports: {
      isConfigured: false,
      sendProductInquiryToAdmin: async () => {},
      sendProductInquiryConfirmation: async () => {},
      sendPasswordChangeConfirmation: async () => {}
    } };
  }
  const contactController = require("../controllers/contactController");
  const inquiryController = require("../controllers/productInquiryController");
  const passwordResetController = require("../controllers/passwordResetController");
  servicePaths.forEach((name, index) => {
    const id = require.resolve(name);
    if (originalEntries[index]) require.cache[id] = originalEntries[index];
    else delete require.cache[id];
  });
  let savedContact;
  let savedInquiry;
  t.mock.method(Contact.prototype, "save", async function() { savedContact = this; return this; });
  t.mock.method(ProductInquiry.prototype, "save", async function() { savedInquiry = this; return this; });
  t.mock.method(require("../models").Product, "findById", async () => ({ name: "Test Product" }));
  const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  const req = body => ({ body, ip: "127.0.0.1", headers: {}, get: () => "test" });
  const contactResponse = response();
  await contactController.submitContact(req({ name: "Test Visitor", email: "visitor@example.com", subject: "Question", phone: "+256700000000", message: "Please call me about a project." }), contactResponse, error => { throw error; });
  assert.equal(contactResponse.statusCode, 201);
  assert.equal(savedContact.subject, "Question");
  assert.equal(savedContact.phone, "+256700000000");
  const inquiryResponse = response();
  await inquiryController.createInquiry(req({ productId: "507f1f77bcf86cd799439011", customerName: "Test Visitor", quantity: "3", customerEmail: "visitor@example.com" }), inquiryResponse);
  assert.equal(inquiryResponse.statusCode, 201);
  assert.equal(savedInquiry.customerName, "Test Visitor");
  assert.equal(savedInquiry.quantity, 3);
  const user = { email: "visitor@example.com", name: "Test Visitor", passwordResetToken: "old-token", passwordResetExpires: new Date(), async save() {} };
  t.mock.method(require("../models").User, "findOne", async filter => {
    assert.equal(filter.email, "visitor@example.com");
    assert.equal(filter.passwordResetToken, require("node:crypto").createHash("sha256").update("123456").digest("hex"));
    assert.ok(filter.passwordResetExpires.$gt);
    return user;
  });
  const resetResponse = response();
  await passwordResetController.resetPassword(req({ email: "visitor@example.com", verificationCode: "123456", newPassword: "StrongPass1!" }), resetResponse);
  assert.equal(resetResponse.statusCode, 200);
  assert.notEqual(user.password, "StrongPass1!");
  assert.equal(await require("bcryptjs").compare("StrongPass1!", user.password), true);
  assert.equal(user.passwordResetToken, undefined);
  assert.equal(user.passwordResetExpires, undefined);
  const weakResponse = response();
  await passwordResetController.resetPassword(req({ email: "visitor@example.com", verificationCode: "123456", newPassword: "weak" }), weakResponse);
  assert.equal(weakResponse.statusCode, 400);
});
