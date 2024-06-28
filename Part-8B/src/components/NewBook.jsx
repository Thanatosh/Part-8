import { useState } from 'react';

const NewBook = (props) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [published, setPublished] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);

  if (!props.show) {
    return null
  };

  const submit = async (event) => {
    event.preventDefault()

    console.log('add book...')

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
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