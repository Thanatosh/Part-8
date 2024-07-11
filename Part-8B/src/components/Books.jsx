import { useQuery } from "@apollo/client";
import { useState } from "react";
import { ALL_BOOKS, ALL_GENRES } from "../queries";

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const { loading, error, data } = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre },
    skip: !props.show,
  });

  const { loading: genresLoading, error: genresError, data: genresData, refetch } = useQuery(ALL_GENRES);

  if (!props.show) {
    return null
  };

  if (loading || genresLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (genresError) return <p>Error: {genresError.message}</p>;

  const genres = genresData.allGenres;

  const handleGenreChange = (event) => {
    const newGenre = event.target.value;
    setSelectedGenre(newGenre);
    refetch({ genre: newGenre });
  };

  return (
    <div>
      <h2>Books</h2>
      <div>
        <select onChange={handleGenreChange} value={selectedGenre || ''}>
          <option value=''>All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>
      <table>
        <tbody>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Published</th>
          </tr>
          {data.allBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

export default Books;