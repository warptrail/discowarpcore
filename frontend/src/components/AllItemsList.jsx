import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 2rem;
  color: white;
`;

const Controls = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: red;
`;

const TH = styled.th`
  border-bottom: 1px solid #ccc;
  text-align: left;
  padding: 8px;
`;

const TD = styled.td`
  border-bottom: 1px solid #eee;
  padding: 8px;
`;

const Select = styled.select`
  padding: 0.5rem;
`;

export default function AllItemsList() {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState('alpha');
  const [filter, setFilter] = useState('all'); // 'all', 'orphaned', 'boxed'

  useEffect(() => {
    fetch('http://localhost:5002/api/items')
      .then((res) => res.json())
      .then(setItems)
      .catch((err) => console.error('❌ Failed to fetch items:', err));
  }, []);

  function getFilteredItems() {
    let filtered = [...items];

    if (filter === 'orphaned') {
      filtered = filtered.filter((item) => !item.box);
    } else if (filter === 'boxed') {
      filtered = filtered.filter((item) => item.box);
    }

    if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'box') {
      filtered.sort((a, b) => {
        const boxA = a.box?.box_id || '';
        const boxB = b.box?.box_id || '';
        return boxA.localeCompare(boxB);
      });
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => {
        const aTime = new Date(parseInt(a._id.substring(0, 8), 16) * 1000);
        const bTime = new Date(parseInt(b._id.substring(0, 8), 16) * 1000);
        return bTime - aTime; // most recent first
      });
    }

    return filtered;
  }

  const filteredItems = getFilteredItems();

  return (
    <Wrapper>
      <h2>📦 All Items</h2>
      <Controls>
        <label>
          Filter:
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="boxed">Boxed</option>
            <option value="orphaned">Orphaned</option>
          </Select>
        </label>

        <label>
          Sort by:
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="alpha">Alphabetical</option>
            <option value="box">Box ID</option>
            <option value="date">Date Added</option>
          </Select>
        </label>
      </Controls>

      <Table>
        <thead>
          <tr>
            <TH>Name</TH>
            <TH>Quantity</TH>
            <TH>Tags</TH>
            <TH>Box</TH>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item._id}>
              <TD>{item.name}</TD>
              <TD>{item.quantity}</TD>
              <TD>{item.tags?.join(', ')}</TD>
              <TD>
                {item.box ? (
                  <>
                    <strong>{item.box.box_id}</strong> – {item.box.description}
                  </>
                ) : (
                  <em>Orphaned</em>
                )}
              </TD>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}
