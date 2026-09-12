import "./App.css"

type AppProps = {
    theme: string
}

const App = ({ theme }: AppProps) => {
    return (
        <div className="content">
            <h1>Rsbuild with React</h1>
            <p>Current theme: {theme}</p>
            <p>Start building amazing things with Rsbuild.</p>
            <p>zanaty was here and created branch zanaty</p>
        </div>
    )
}

export default App
