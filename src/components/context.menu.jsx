import React from "react";

const ContextMenu = (props) => {

    const {file, clientX, clientY, showMenu, open, openInTab, openAsEmbed} = props;
    const style = { top: `${clientY}px`, left: `${clientX}px`}

    if (!file) return <div></div>;

    if (file.mimeType === 'application/vnd.google-apps.folder'){
        return (
            <div style={style} className={!showMenu ? 'context-menu': 'context-menu active'}>
                <div onClick={() => open(file)}>open</div>
            </div>
        )
    }

    return (
        <div style={style} className={!showMenu ? 'context-menu': 'context-menu active'}>
            <div onClick={() => openInTab(file)}>Open in new tab</div>
            <div onClick={() => openAsEmbed(file)}>Show as embedded file</div>
        </div>
    )
}
export default ContextMenu;
