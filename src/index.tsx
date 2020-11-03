import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'
import axios from 'axios'
import Media from 'react-media'

axios.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params['token'] = process.env.REACT_APP_ARCHILOGIC_PUBLISHABLE_API_KEY;

    return config;
}, (error) => {
    return Promise.reject(error);
});

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
