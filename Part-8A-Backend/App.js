const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const mongoose = require('mongoose')
const Author = require('./models/Author')
const Book = require('./models/Book')
const User = require('./models/User')
const jwt = require('jsonwebtoken')
const { GraphQLError } = require('graphql')

mongoose.set('strictQuery', false)
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to MongoDB')

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
})

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(name: String, genre:String): [Book!]!
    allAuthors: [Author!]!
    allGenres: [String!]!
    bookAuthor(name: String!): [Book!]!
    me: User
    recommendedBooks: [Book!]!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: async () => {
      console.log("bookCount query executed");
      return Book.collection.countDocuments();
    },
    authorCount: async () => {
      console.log("authorCount query executed");
      return Author.collection.countDocuments();
    },
    allBooks: async (root, args) => {
      console.log("allBooks query executed with args:", args);
      let filteredBooks = await Book.find({}).populate('author')
      if (args.name) {
        filteredBooks = filteredBooks.filter(book => book.author.name === args.name)
      }
      if (args.genre) {
        filteredBooks = filteredBooks.filter(book => book.genres.includes(args.genre))
      }
      return filteredBooks
    },
    allAuthors: async () => {
      console.log("allAuthors query executed");
      return await Author.find({});
    },
    allGenres: async () => {
      console.log("allGenres query executed");
      const books = await Book.find({});
      const genres = [...new Set(books.flatMap(book => book.genres))];
      return genres;
    },
    me: (root, args, context) => {
      return context.currentUser
    },
    recommendedBooks: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('Not authenticated');
      }
      const books = await Book.find({ genres: context.currentUser.favoriteGenre }).populate('author');
      return books;
    }
  },
  Author: {
    bookCount: async (parent) => {
      console.log(`bookCount for author ${parent._id} executed`);
      return Book.countDocuments({ author: parent._id });
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      console.log("addBook mutation executed with args:", args);
      let author = await Author.findOne({ name: args.author })
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      if (!author) {
        author = new Author({ name: args.author })
        await author.save()
      }
      const book = new Book({ ...args, author: author._id })
      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError('Saving Book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        })
      }
      return book.populate('author')
    },
    editAuthor: async (root, args, context) => {
      console.log("editAuthor mutation executed with args:", args);
      const author = await Author.findOne({ name: args.name })
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      if (!author) {
        throw new GraphQLError('Author not found', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name
          }
        })
      }

      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new GraphQLError('Editing Author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        })
      }
      return author
    },
    createUser: async (root, args) => {
      console.log("createUser mutation executed with args:", args);
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.username,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      console.log("login mutation executed with args:", args);
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
        favoriteGenre: user.favoriteGenre
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})