import { useState } from 'react';
import { gql, useMutation } from "@apollo/client";

const ADD_BOOK = gql`
  mutation newBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
    addBook(
      title: $title,
      author: $author,
      published: $published,
      genres: $genres
    ) {
      title
      author
      published
      genres
    }
  }
`;

const NewBook = (props) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [published, setPublished] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);
  
  const [ newBook ] = useMutation(ADD_BOOK);

  if (!props.show) {
    return null
  };

  const submit = async (event) => {
    event.preventDefault()

    try {
      await newBook({ variables: { title, author, published: parseInt(published), genres } });
      setTitle('');
      setPublished('');
      setAuthor('');
      setGenres([]);
      setGenre('');
    } catch (e) {
      console.error("Error creating new book:", e);
    }
  };

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          Title: 
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          Author: 
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          Published: 
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            Add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">Create book</button>
      </form>
    </div>
  )
};

export default NewBook;