import React, {Fragment} from "react";
import shortid from "shortid";

const PathView = (props) => {
    const { paths } = props;

    return (
        <Fragment>
            <div className="path-list">
                {
                   paths.map(x => <div key={shortid.generate()} onClick={() => props.navigate(x)}>
                       <span className="path-name">{` ${x.name} /`}</span>
                   </div>)
                }
            </div>
            <hr/>
        </Fragment>
    )
}
export default PathView;
