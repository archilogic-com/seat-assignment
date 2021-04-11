import React from 'react'
import ReactDOM from 'react-dom'
import Media from 'react-media'
import App from './App'
import './index.css'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(

<>
    <Media query="(max-width: 500px)" render={() =>
        (
          <div><img className='device-not-supported' src={require("./warning.png")} alt="" /></div>
        )}
      />
      <Media query="(min-width: 501px)" render={() =>
        (
          <App />
        )}
      />

</>, document.getElementById('root'))




// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
