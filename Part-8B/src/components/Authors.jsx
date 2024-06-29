import { useState } from 'react'
import { gql, useQuery, useMutation } from "@apollo/client";

const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
    }
  }
`;

const EDIT_BIRTHYEAR = gql`
  mutation editBirthyear($name: String!, $born: Int!) {
    editAuthor(name: $name, setBornTo: $born) {
      name
      born
    }
  }
`

const Authors = (props) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [ changeYear ] = useMutation(EDIT_BIRTHYEAR)
  const { loading, error, data } = useQuery(ALL_AUTHORS, {
    pollInterval: 2000
  });

  if (!props.show) {
    return null;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const submit = async (event) => {
    event.preventDefault()
    changeYear({ variables: { name, born: parseInt(born) } })
    setName('')
    setBorn('')
  }

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
            Name: <input
              value={name}
              onChange={({ target }) => setName(target.value)}
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
