import React from 'react';

const Connect = (props) => {

  return (
    <div className="wrapper">
      <p style={{fontWeight: 500}}>Connent your google drive account</p>
      <button className="selected" onClick={() => props.connect()}>Connect Google Drive</button>
    </div>
  )
}
export default Connect;
