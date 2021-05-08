import React from 'react';
import FolderIcon from "./folder.icon";
import Checkbox from "./check.box";
import {localDate, localTime} from "./util";

const ListItem = (props) => {

    const {file} = props;

    const toggleSelect = (e) => {
        props.select(e.target.checked, file);
    }

    return (
        <div className="list-item-container">

            {file.mimeType !== 'application/vnd.google-apps.folder' &&
            <div className="checkbox-container">
                <Checkbox select={toggleSelect} file={file}></Checkbox>
            </div>
            }


            {file.mimeType === 'application/vnd.google-apps.folder' &&
            <div className="checkbox-placeholder">

            </div>
            }

            {file.mimeType !== 'application/vnd.google-apps.folder' &&
            <img src={file.thumbnailLink} style={{width: '44px', height: '54px'}} alt=""/>}

            {file.mimeType === 'application/vnd.google-apps.folder' &&
            <FolderIcon color={file.folderColorRgb}></FolderIcon>}


            <div className="list-item-name">{file.name}</div>

            <div className="list-item-date">{
                `${localDate(file.modifiedTime)} - ${localTime(file.modifiedTime)}`
            }</div>
        </div>
    )
}

export default ListItem;
