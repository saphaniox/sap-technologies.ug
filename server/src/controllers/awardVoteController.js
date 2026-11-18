const { body, param, validationResult } = require("express-validator");
const { Nomination } = require("../models/Award");
const cache = require("../services/cacheService");

const adminVoteValidation = [
    param("id").isMongoId().withMessage("Invalid nomination ID"),
    body("amount").isInt({ min: 1, max: 1000000 }).withMessage("Enter a whole number between 1 and 1,000,000"),
    body("reason").isString().bail().trim().isLength({ min: 5, max: 300 }).withMessage("Provide a reason between 5 and 300 characters")
];

async function addAdminVotes(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "error", message: "Please check the vote amount and reason", errors: errors.array() });
        }
        const amount = Number(req.body.amount);
        const nomination = await Nomination.findByIdAndUpdate(req.params.id, {
            $inc: { votes: amount, adminVotes: amount },
            $push: { voteAdjustments: {
                amount, reason: req.body.reason.trim(), addedBy: req.user._id, addedAt: new Date()
            } }
        }, { new: true, runValidators: true }).populate("category", "name description icon iconName");
        if (!nomination) {
            return res.status(404).json({ status: "error", message: "Nomination not found" });
        }
        cache.invalidateNominations();
        cache.invalidateAwardCategories();
        return res.json({ status: "success", message: "Admin votes added", data: { nomination } });
    } catch (error) {
        next(error);
    }
}

module.exports = { addAdminVotes, adminVoteValidation };
