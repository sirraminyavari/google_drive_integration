import React, {Fragment} from 'react';
import ListItem from './list.item';
import shortid from 'shortid';

const ListView = (props) => {

  const{ files } = props;


  return (
    <Fragment>
      {
        files.map(x => <div key={shortid.generate()}
                            onDoubleClick={() => props.open(x)}>
          <ListItem file={x}></ListItem>
        </div>)
      }
    </Fragment>
  )
}

export default ListView;
