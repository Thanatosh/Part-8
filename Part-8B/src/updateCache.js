export const updateCache = (cache, query, addedBook) => {
  cache.updateQuery(query, (data) => {
    if (!data || !data.allBooks) {
      return { allBooks: [addedBook] };
    }
    return {
      allBooks: data.allBooks.concat(addedBook),
    };
  });
};
