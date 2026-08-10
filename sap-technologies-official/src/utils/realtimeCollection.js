const getItemId = (item) => item?._id || item?.id || null;

export const sortByOrderThenNewest = (items, orderKey = "displayOrder") => (
  [...items].sort((first, second) => {
    const firstOrder = Number(first?.[orderKey] ?? first?.order ?? 0);
    const secondOrder = Number(second?.[orderKey] ?? second?.order ?? 0);
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return new Date(second?.createdAt || 0) - new Date(first?.createdAt || 0);
  })
);

export const upsertById = (items, item, options = {}) => {
  const itemId = getItemId(item);
  if (!itemId) return items;

  const {
    orderKey = "displayOrder",
    include = () => true
  } = options;

  const withoutCurrent = items.filter((current) => getItemId(current) !== itemId);
  if (!include(item)) return withoutCurrent;

  return sortByOrderThenNewest([item, ...withoutCurrent], orderKey);
};

export const removeById = (items, id) => (
  items.filter((item) => getItemId(item) !== id)
);

export const buildCountGroups = (items, key) => (
  Object.values(items.reduce((groups, item) => {
    const groupName = item?.[key] || "Other";
    if (!groups[groupName]) groups[groupName] = { name: groupName, _id: groupName, count: 0 };
    groups[groupName].count += 1;
    return groups;
  }, {})).sort((first, second) => String(first.name || first._id).localeCompare(String(second.name || second._id)))
);
