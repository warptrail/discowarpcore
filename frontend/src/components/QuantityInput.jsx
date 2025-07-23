// components/QuantityInput.jsx
import styled from 'styled-components';

const QuantityWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 30%;
  margin: 0 auto;
  background-color: #2a452c;
  border-radius: 6px;
  overflow: hidden;
`;

const Button = styled.button`
  background: #222;
  color: #00ffcc;
  border: none;
  font-size: 1.25rem;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;

  &:hover {
    background-color: #333;
  }
`;

const QuantityField = styled.input.attrs({
  inputMode: 'numeric',
  pattern: '[0-9]*',
})`
  width: 3rem;
  text-align: center;
  padding: 0.25rem;
  border: 1px solid #444;
  background: #111;
  color: #fff;
  font-size: 1rem;
  border-radius: 4px;
`;
const QuantityInput = ({ value, onChange }) => {
  const handleIncrement = () => {
    if (value < 99) onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleChange = (e) => {
    let num = parseInt(e.target.value);
    if (!isNaN(num)) {
      if (num < 1) num = 1;
      if (num > 99) num = 99;
      onChange(num);
    }
  };

  return (
    <QuantityWrapper>
      <Button type="button" onClick={handleDecrement}>
        −
      </Button>
      <QuantityField
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        min="1"
        max="99"
      />
      <Button type="button" onClick={handleIncrement}>
        +
      </Button>
    </QuantityWrapper>
  );
};

export default QuantityInput;
