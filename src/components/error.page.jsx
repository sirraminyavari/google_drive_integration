const ErrorPage = (props) => {
    const { error, back } = props;
    return (
        <div style={{ padding: '50px'}}>
            <div style={{ marginBottom: '50px'}}>
                <div>message: {error.message}</div>
                <div>code: {error.code}</div>
            </div>
            <button className="filter-btn" onClick={() => back()}>RETURN TO HOME</button>
        </div>
    )
}
export default ErrorPage;
