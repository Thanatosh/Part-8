const { GraphQLError } = require("graphql");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const Author = require("./models/Author");
const Book = require("./models/Book");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const resolvers = {
  Query: {
    bookCount: async () => {
      return Book.collection.countDocuments();
    },
    authorCount: async () => {
      return Author.collection.countDocuments();
    },
    allBooks: async (root, args) => {
      console.log("allBooks query executed");
      let filter = {};
      if (args.genre) {
        filter.genres = { $in: [args.genre] };
      }
      return Book.find(filter).populate("author");
    },
    allAuthors: async () => {
      console.log("allAuthors query executed");
      return await Author.find({});
    },
    allGenres: async () => {
      console.log("allGenres query executed");
      const books = await Book.find({});
      const genres = [...new Set(books.flatMap((book) => book.genres))];
      return genres;
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
    recommendedBooks: async (root, args, context) => {
      console.log("recommendedBooks query executed");
      if (!context.currentUser) {
        throw new GraphQLError("Not authenticated");
      }
      const books = await Book.find({
        genres: context.currentUser.favoriteGenre,
      }).populate("author");
      return books;
    },
  },
  Author: {
    bookCount: async (parent) => {
      return Book.countDocuments({ author: parent._id });
    },
  },
  Book: {
    author: async (parent) => Author.findById(parent.author),
  },
  Mutation: {
    addBook: async (root, args, context) => {
      console.log("Adding book with args:", args);
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }

      let author = await Author.findOne({ name: args.author });
      if (!author) {
        author = new Author({ name: args.author });
        try {
          await author.save();
        } catch (error) {
          console.error("Error saving author:", error);
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
      }

      const book = new Book({ ...args, author });
      try {
        await book.save();
      } catch (error) {
        console.error("Error saving book:", error);
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }

      pubsub.publish("BOOK_ADDED", { bookAdded: book });

      return book;
    },
    editAuthor: async (root, args, context) => {
      console.log("editAuthor mutation executed with args:", args);
      const author = await Author.findOne({ name: args.name });
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      if (!author) {
        throw new GraphQLError("Author not found", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        });
      }

      author.born = args.setBornTo;
      try {
        await author.save();
      } catch (error) {
        throw new GraphQLError("Editing Author failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args,
            error,
          },
        });
      }
      return author;
    },
    createUser: async (root, args) => {
      console.log("createUser mutation executed with args:", args);
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.username,
            error,
          },
        });
      });
    },
    login: async (root, args) => {
      console.log("login mutation executed with args:", args);
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
        favoriteGenre: user.favoriteGenre,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
