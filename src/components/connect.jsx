import React from 'react';

const Connect = (props) => {
  const wrapper = {
    with: '100%',
    padding: 50,
  };

  const btn = {
    border: 'none',
    outline: 'none',
    backgroundColor: '#03a9f4',
    color: 'white',
    padding: '6px 30px'
  };

  return (
    <div style={wrapper}>
      <p style={{fontWeight: 500}}>Connent your google drive account</p>
      <button style={btn} onClick={() => props.connect()}>Connect Google Drive</button>
    </div>
  )
}
export default Connect;