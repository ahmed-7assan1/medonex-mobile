import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QuestionCardContent } from "__QUIZ_CONTENT__";
const scope = new URLSearchParams(location.hash.slice(1)).get("scope") || "";
const emit = (message) => {
  const value = { ...message, scope };
  if (window.ReactNativeWebView)
    window.ReactNativeWebView.postMessage(JSON.stringify(value));
  else window.parent.postMessage(value, "*");
};
function App() {
  const [props, setProps] = useState(null);
  useEffect(() => {
    window.renderQuestionProps = (next) => {
      if (!next || next.scope !== scope) return;
      document.documentElement.classList.toggle("dark", next.theme === "dark");
      document.documentElement.dataset.theme = next.theme;
      document.documentElement.dir = next.direction || "ltr";
      document.documentElement.dataset.context = next.hubReview?"lecture-hub":next.lectureReview
        ? "lecture-review"
        : "quiz";
      setProps(next);
    };
    const accept = (event) => {
      if (event.source === window.parent && event.data?.type === "render")
        window.renderQuestionProps(event.data);
    };
    window.addEventListener("message", accept);
    emit({ type: "ready" });
    const observer = new ResizeObserver(() =>
      emit({
        type: "height",
        height: document.getElementById("root").getBoundingClientRect().height,
      })
    );
    observer.observe(document.getElementById("root"));
    return () => {
      observer.disconnect();
      window.removeEventListener("message", accept);
    };
  }, []);
  if (!props) return null;
  return (
    <div className={props.hubMobile?"lecture-mobile":""}><div className={props.hubReview?"qo-card":props.lectureReview ? "lecture-review-content" : "qo-card"}>
      <QuestionCardContent
        showDifficulty={props.lectureReview}
        question={props.question}
        selectedAnswer={props.selectedAnswer}
        showResult={props.showResult}
        essayReview={props.essayReview}
        onAnswer={(key) =>
          emit({ type: "answer", key, questionId: props.question.id })
        }
      />
    </div></div>
  );
}
document.addEventListener(
  "click",
  (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    event.preventDefault();
    try {
      const url = new URL(link.href);
      if (url.protocol === "https:") emit({ type: "link", url: url.href });
    } catch {}
  },
  true
);
createRoot(document.getElementById("root")).render(<App />);
