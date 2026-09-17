import { SectionReveal } from "./marketing-ui";
import ui from "./marketing.module.css";
import styles from "./philosophy-section.module.css";

export function PhilosophySection() {
  return (
    <section className={styles.section} aria-labelledby="principles-title">
      <div className={styles.spread}>
        <SectionReveal className={styles.intro} distance={12}>
          <p className={ui.eyebrow}>Наша философия</p>
          <h2 id="principles-title">
            Хорошая работа<br />
            начинается<br />
            <span>с отношения</span>
          </h2>
          <svg className={styles.mark} viewBox="0 0 96 96" fill="none" aria-hidden="true">
            <path d="M48 8v80M8 48h80M20 20l56 56M20 76l56-56" stroke="currentColor" strokeWidth="9" />
          </svg>
        </SectionReveal>

        <div className={styles.article}>
          <SectionReveal distance={12}>
            <p className={styles.lead}>
              Не просто закрыть обращение, а понять задачу, найти причину и сделать работу вашего бизнеса стабильнее.
            </p>
          </SectionReveal>
          <div className={styles.prose}>
            <SectionReveal distance={10}>
              <p><strong>Ответственность.</strong> Решаем задачи комплексно, отвечаем за качество и сроки и заранее оцениваем последствия каждого решения.</p>
              <p><strong>Репутация.</strong> Дорожим доверием клиентов, честно говорим о ситуации и не принимаем решений, за которые придётся оправдываться.</p>
            </SectionReveal>
            <SectionReveal distance={10}>
              <p><strong>Решение вместо оправданий.</strong> Не ограничиваемся устранением симптомов: ищем первопричину и предлагаем рабочий вариант действий.</p>
              <p><strong>Развитие и инициатива.</strong> Постоянно улучшаем навыки, инструменты и внутренние процессы, если это делает работу клиента стабильнее.</p>
              <p><strong>Самостоятельность и команда.</strong> Берём задачу в работу сами, а когда нужны дополнительные компетенции — сразу подключаем опытных коллег.</p>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
