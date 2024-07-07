import { useState } from 'react';
import { useQuery, useMutation } from "@apollo/client";
import Select from 'react-select';
import { ALL_AUTHORS, EDIT_BIRTHYEAR } from "../queries";

const Authors = (props) => {
  const [born, setBorn] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const { loading, error, data, refetch } = useQuery(ALL_AUTHORS, {
    skip: !props.show,
  });
  
  const [changeYear] = useMutation(EDIT_BIRTHYEAR, {
    onCompleted: () => refetch()
  });

  if (!props.show) {
    return null;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const authorOptions = data.allAuthors.map((author) => ({
    value: author.name,
    label: author.name,
  }));

  const submit = async (event) => {
    event.preventDefault()
    if (selectedAuthor) {
      await changeYear({ variables: { name: selectedAuthor.value, born: parseInt(born) } })
      setSelectedAuthor(null);
      setBorn('');
    }
  };

  return (
    <div>
      <h2>Authors</h2>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <th>Born</th>
            <th>Books</th>
          </tr>
          {data.allAuthors.map((author) => (
            <tr key={author.name}>
              <td>{author.name}</td>
              <td>{author.born}</td>
              <td>{author.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Set birthyear</h3>
        <form onSubmit={submit}>
          <div>
          Name: 
            <Select
              value={selectedAuthor}
              onChange={setSelectedAuthor}
              options={authorOptions}
            />
          </div>
          <div>
            Born: <input
              type="number"
              value={born}
              onChange={({ target }) => setBorn(target.value)}
            />
          </div>
          <button type='submit'>Change birthyear</button>
        </form>
      </div>
    </div>
  );
};

export default Authors;
