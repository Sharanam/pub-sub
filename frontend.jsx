import { For, render } from "solid-js/web";
import "./app.css";
import { Show, createSignal } from "solid-js";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(() => <App key={0} />, root);

function App() {
  const ws = new WebSocket(`ws://localhost:${import.meta.env.WS_PORT || 8080}`);

  ws.onopen = () => {
    console.log("Connected to the WebSocket server");
  };

  const [channel, setChannel] = createSignal("test-channel");
  const [message, setMessage] = createSignal("");

  const [incomingMessages, setIncomingMessages] = createSignal({});

  ws.onmessage = (event) => {
    let [channel, message] = event.data.split(/:(.+)/).map((x) => x.trim());
    setIncomingMessages((prev) => {
      return {
        ...prev,
        [channel]: message
          ? [...(prev[channel] || []), message]
          : prev[channel],
      };
    });
  };

  function handleSubmit(e) {
    if (e.key === "Enter") {
      if (!channel() || !message()) return;
      ws.send(JSON.stringify({ channel: channel(), message: message() }));
      setMessage("");
    }
  }

  function beautify(message) {
    let res;
    try {
      message = JSON.parse(message);
      res = JSON.stringify(message, null, 2);

      res = res
        .replace(/\\n/g, "<br>")
        .replace(/"(.*?)":/g, "<b>$1</b>:")
        .replace(/ /g, "&nbsp;")
        .replace(/\n/g, "<br />");
    } catch (_) {
      res = message;
    }

    return res;
  }

  return (
    <>
      <h1>Redis Pub/Sub</h1>
      <input
        id="message"
        type="text"
        autofocus
        placeholder="Send to Redis Pub/Sub"
        value={message()}
        onInput={(e) => setMessage(e.target.value)}
        onKeyUp={handleSubmit}
      />
      <input
        type="text"
        id="channel"
        placeholder="Channel name"
        value={channel()}
        onInput={(e) => setChannel(e.target.value)}
        onKeyUp={handleSubmit}
      />
      <div id="messages">
        <For
          each={Object.keys(incomingMessages())}
          fallback={<p>No messages</p>}
        >
          {(channel) => (
            <p>
              <strong>{channel}</strong>
              <Show when={incomingMessages()[channel]?.length}>
                <For each={incomingMessages()[channel]}>
                  {(message) => (
                    <span
                      className="unit"
                      innerHTML={message && beautify(message)}
                    ></span>
                  )}
                </For>
              </Show>
            </p>
          )}
        </For>
      </div>
    </>
  );
}
