import React from 'react';
import FolderIcon from "./folder.icon";
import Checkbox from "./check.box";

const GridItem = ({ file }) => {
    return (
        <div className="grid-item">
            <div style={{display: 'flex', padding: '5px'}}>

                { file.mimeType !== 'application/vnd.google-apps.folder' && <div className="checkbox-container"><Checkbox></Checkbox></div>}

                {file.mimeType !== 'application/vnd.google-apps.folder' && <img src={file.thumbnailLink} style={{width: '44px', height: '54px'}}/> }

                {file.mimeType === 'application/vnd.google-apps.folder' && <FolderIcon color={file.folderColorRgb}></FolderIcon> }

                <div style={{height: '54px', display: "flex", flexDirection: 'column', justifyContent: 'space-around', marginLeft: '25px'}}>
                    <div>{file.name}</div>
                    <div style={{fontSize: '12px', color: '#bdbdbd'}}>{file.modifiedTime}</div>
                </div>
            </div>
        </div>
    )
}
export default GridItem;
