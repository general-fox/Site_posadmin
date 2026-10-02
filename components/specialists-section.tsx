"use client";

import Link from "next/link";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import ui from "./marketing.module.css";
import styles from "./specialists-section.module.css";

const QUESTIONS = [
  {
    id: "scope",
    title: "Что мы берём на себя?",
    answer: <>
      <p>Ежедневные технические задачи ресторана — от работы кассы до инфраструктуры, которая связывает всё вместе.</p>
      <ul>
        <li><strong>r_keeper:</strong> настройка и обновления, помощь кассирам и официантам, сопровождение меню и словарей.</li>
        <li><strong>Кассы и учётные системы:</strong> техническое сопровождение ККТ, ЕГАИС, Честного знака, Меркурия и ЭДО.</li>
        <li><strong>IT-инфраструктура:</strong> компьютеры, сеть, Wi-Fi, телефония, видеонаблюдение и резервное копирование.</li>
      </ul>
      <p className={styles.note}>Сопровождение r_keeper и IT-администрирование рассчитываются отдельно. Нужные модули и границы ответственности согласуем до подключения.</p>
    </>,
  },
  {
    id: "tasks",
    title: "Какие вопросы помогаем закрыть?",
    answer: <>
      <p>Не печатает принтер на кухне, возникла ошибка на кассе, пропал интернет или нужно изменить меню — помогаем разобраться с причиной и восстановить работу. Плановые настройки и обновления тоже берём на себя в рамках сопровождения.</p>
      <p>Если заведение открывается или растёт, подбираем оборудование, настраиваем рабочие места и связываем системы. Запуск, новые интеграции и проектные работы оцениваем отдельно от ежемесячного обслуживания.</p>
    </>,
  },
  {
    id: "support",
    title: "Как устроена поддержка 24/7?",
    answer: <>
      <p>Вы пишете в выделенный чат Telegram или MAX. Менеджер координирует работу и подключает нужных специалистов: по r_keeper, кассам, учётным системам или IT-инфраструктуре. Всю задачу ведёт одна команда.</p>
      <p>Техническая поддержка принимает обращения круглосуточно. Сроки реакции и порядок решения задач фиксируем в договоре. Если нужен инженер на месте, выездное сопровождение можно подключить отдельным модулем — в доступных городах.</p>
    </>,
  },
  {
    id: "trust",
    title: "Почему нам доверяют?",
    answer: <>
      <p>Более 15 лет автоматизируем бизнес, за это время запустили более 1 000 объектов. Posadmin — официальный дилер r_keeper. Работаем с заведениями на постоянной основе: среди наших клиентов Stars Coffee, «Магадан» и «Сыроварня».</p>
      <p>Согласуем состав работ и сроки заранее, координируем специалистов и ищем причины повторяющихся сбоев. После запуска продолжаем сопровождать систему и помогать команде заведения.</p>
      <Link className={styles.answerLink} href="#clients-title">Посмотреть наших клиентов <ArrowRight diagonal /></Link>
    </>,
  },
  {
    id: "start",
    title: "Как подключиться и узнать стоимость?",
    answer: <>
      <p>Можно обратиться и с новым, и с уже работающим рестораном. Расскажите, какими системами пользуетесь и что хотите передать на сопровождение. Проверим конфигурацию, подберём нужные модули и согласуем условия.</p>
      <p>Предварительную ежемесячную стоимость можно рассчитать на сайте: укажите количество рабочих мест и выберите состав сопровождения. Расчёт сохраняется в PDF. Для сети заведений обсудим параметры каждого объекта.</p>
      <Link className={styles.answerLink} href="/#pricing">Перейти к расчёту <ArrowRight /></Link>
    </>,
  },
];

export function SpecialistsSection() {
  return <section id="about" className={`${styles.section} section-atmosphere-host`} aria-labelledby="specialists-title">
    <SectionAtmosphere />
    <div className={styles.shell}>
      <div className={styles.intro}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>О нас · Команда Posadmin</p><h2 id="specialists-title">Одна команда<br /><span>Все технические вопросы</span></h2></SectionReveal>
        <SectionReveal className={styles.description} distance={18} delay={0.12}><p>Сопровождаем r_keeper, кассы и IT-инфраструктуру ресторана. Берём ежедневные технические задачи на себя, чтобы ваша команда могла заниматься гостями.</p></SectionReveal>
      </div>
      <div className={styles.questions}>
        {QUESTIONS.map(({ id, title, answer }, index) => (
          <details className={styles.question} id={`about-${id}`} name="about-questions" key={id} open={index === 0}>
            <summary className={styles.questionTitle}>
              <span className={styles.number} aria-hidden="true">0{index + 1}</span>
              <h3>{title}</h3>
              <span className={styles.toggle} aria-hidden="true"><span /><span /></span>
            </summary>
            <div className={styles.answer}>{answer}</div>
          </details>
        ))}
      </div>
      <div className={styles.actions}>
        <Link href="/#pricing" className={ui.primary}>Подобрать сопровождение <ArrowRight /></Link>
        <Link href="/about" className={ui.textLink}>Подробнее о компании <ArrowRight diagonal /></Link>
      </div>
    </div>
  </section>;
}
