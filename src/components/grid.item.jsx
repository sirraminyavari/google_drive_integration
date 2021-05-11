import React from 'react';
import FolderIcon from "./folder.icon";
import Checkbox from "./check.box";
import {localDate, localTime} from "./util";

const GridItem = (props) => {

    const {file} = props;

    const toggleSelect = (e) => {
        props.select(e.target.checked, file);
    }

    return (
        <div className="grid-item">
            <div style={{display: 'flex', padding: '5px'}}>

                {
                    file.mimeType !== 'application/vnd.google-apps.folder' &&
                    <div className="checkbox-container">
                        <Checkbox select={toggleSelect} file={file}></Checkbox>
                    </div>
                }

                {file.mimeType === 'application/vnd.google-apps.folder' &&
                <div className="checkbox-placeholder">

                </div>
                }


                {file.mimeType !== 'application/vnd.google-apps.folder' &&
                <img src={file.hasThumbnail ? file.thumbnailLink: file.iconLink}
                     className={file.hasThumbnail ? 'file-thumbnail': 'file-icon'} alt=""/>}

                {file.mimeType === 'application/vnd.google-apps.folder' &&
                <FolderIcon color={file.folderColorRgb}></FolderIcon>}

                <div className="grid-item-details">
                    <div>{file.name}</div>
                    <div style={{fontSize: '12px', color: '#bdbdbd'}}>{
                        `${localDate(file.modifiedTime)} - ${localTime(file.modifiedTime)}`
                    }</div>
                </div>
            </div>
        </div>
    )
}
export default GridItem;
