import React, { useState, useContext } from 'react';
import { SelectedFileContext } from "./main";

const findState = (files, file) => {
    const exist = files.find(x => x.id === file.id);
    return (exist) ? true: false;
}

const Checkbox = (props) => {

    const { file } = props;

    const selectedFiles = useContext(SelectedFileContext)
    const [state, setState] = useState(() => findState(selectedFiles, file));

    const changeState = (e) => {
        setState(e.target.checked);
        props.select(e);
    }
    return <input type="checkbox" checked={state} onChange={e => changeState(e)}/>
}
export default Checkbox;
