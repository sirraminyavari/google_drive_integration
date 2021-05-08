import './App.css';
import Main from './components/main';

function App() {
    const getSelectedItems = (files) => {
        console.log(files);
    }
    return (
        <div className="App">
            <Main selected={getSelectedItems}></Main>
        </div>
    );
}

export default App;
