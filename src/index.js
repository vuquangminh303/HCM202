import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app';
import { StateProvider, initialState, reducer } from './state';
import ErrorBoundary from './components/ErrorBoundary';

import './index.scss';

function Root() {
  return (
    <ErrorBoundary>
      <StateProvider initialState={initialState} reducer={reducer}>
        <App />
      </StateProvider>
    </ErrorBoundary>
  );
}

ReactDOM.render(<Root />, document.getElementById('root'));
