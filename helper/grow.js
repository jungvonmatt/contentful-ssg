const BUILD_INS = ['category', 'date', 'dates', 'hidden', 'slug', 'title'];

const transform = (config) => async (content, { contentType }) => {
  const { pageTypes = [] } = config || {};
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => {
      if (BUILD_INS.includes(key) && pageTypes.includes(contentType)) {
        return [`$${key}`, value];
      }

      if (key === 'published_on') {
        return ['$date', value];
      }

      return [key, value];
    })
  );
};
