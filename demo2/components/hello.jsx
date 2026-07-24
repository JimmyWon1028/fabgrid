(function() {
  'use strict';

  function HelloReact() {
    var countState = React.useState(0);
    var count = countState[0];
    var setCount = countState[1];

    return (
      <div className="react-card">
        <p>hello.jsx 已由 fabLoader.react() 載入</p>
        <button
          type="button"
          onClick={function() {
            setCount(count + 1);
          }}
        >
          點擊次數：{count}
        </button>
      </div>
    );
  }

  window.demo2ReactRoot = ReactDOMClient.createRoot(
    $('#react-demo').get(0)
  );
  window.demo2ReactRoot.render(<HelloReact />);
}());
