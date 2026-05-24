# Shannon Lee Portfolio

순수 HTML, CSS, JavaScript로 만든 반응형 개인 포트폴리오입니다. React, Vue, jQuery, Bootstrap, Tailwind CSS 없이 DOM 이벤트, 상태 변경, 렌더링 흐름을 직접 구현했습니다.

## 사용 기술

- HTML5 시맨틱 마크업
- CSS3, CSS 변수, Flexbox, Grid, 모바일 퍼스트 반응형
- JavaScript ES6+, DOM API, fetch, async/await, localStorage
- GitHub REST API
- 개발 권장 환경: VS Code + Live Server
- 확인 권장 브라우저: 최신 Chrome

## 링크

- GitHub 저장소 URL: https://github.com/shannonlee-dev/codyssey_mission/tree/main/2026-main-4-1
- GitHub Pages 배포 URL: https://shannonlee-dev.github.io/codyssey_mission/2026-main-4-1/


## 구현 기준

- 스크롤 탑 버튼 표시 기준: 300px 이상 스크롤
- 네비게이션 배경 변경 기준: 60px 이상 스크롤
- Intersection Observer threshold: 0.2
- GitHub API 엔드포인트: `https://api.github.com/users/shannonlee-dev/repos`
- Formspree 실제 전송: `js/main.js`의 `formspreeEndpoint`에 Formspree 엔드포인트를 설정했고, Contact 폼 제출 시 해당 엔드포인트로 전송합니다.

## 설계 설명

시맨틱 태그는 화면 영역의 의미가 브라우저와 보조 기술에 드러나도록 사용했습니다. 전체 구조는 `header`, `nav`, `main`, 여러 `section`, 프로젝트 `article`, `footer`로 나누었고, 폼 입력은 `label`의 `for`와 입력 `id`를 맞춰 연결했습니다.

Flexbox는 네비게이션처럼 한 축 방향으로 로고와 메뉴를 정렬하는 곳에 사용했습니다. Grid는 Projects 카드처럼 화면 폭에 따라 여러 열이 자동으로 바뀌어야 하는 목록에 `auto-fit`과 `minmax`로 적용했습니다.

DOM 이벤트 흐름은 `querySelector`, `querySelectorAll`로 요소를 선택하고 `addEventListener`로 이벤트를 연결한 뒤, 상태 객체를 바꾸고 렌더 함수가 `textContent`, `innerHTML`, `classList.add/remove/toggle`로 화면을 갱신하는 방식입니다.

ES6 문법은 화살표 함수, 템플릿 리터럴, 구조분해 할당을 사용했습니다. GitHub 저장소 배열은 `map`으로 카드 HTML로 바꾸고, 언어별 프로젝트 표시에는 `filter`, 여러 이벤트 연결에는 `forEach`를 사용했습니다.

비동기 처리는 `fetch`와 `async/await`로 GitHub API를 호출합니다. 요청 전에는 loading 상태를 렌더링하고, 성공하면 카드 목록, 실패하면 에러와 재시도 버튼, 결과가 없으면 빈 상태 메시지를 보여줍니다. 403 응답은 레이트 리밋 가능성이 있으므로 별도 에러 메시지로 처리합니다.

상태-렌더링 흐름은 4가지가 있습니다.

1. 다크 모드 버튼 클릭 -> `theme` 상태 변경 -> `data-theme`와 버튼 텍스트 렌더링
2. GitHub API 호출 -> `projectStatus`, `projects` 상태 변경 -> Projects 섹션 렌더링
3. 폼 입력 이벤트 -> `form.errors` 상태 변경 -> 필드 근처 에러 메시지 렌더링
4. 언어 필터 클릭 -> `activeLanguage` 상태 변경 -> 프로젝트 카드 목록 렌더링

## 스크린샷

- 데스크톱: `screenshots/desktop.png`
- 모바일: `screenshots/mobile.png`
- 다크 모드: `screenshots/dark-mode.png`

세 스크린샷 파일은 `screenshots/` 디렉토리에 포함되어 있습니다.

## 실행 방법

```sh
python3 -m http.server 5500
```

브라우저에서 `http://localhost:5500`을 열어 확인합니다. VS Code를 사용하는 경우 Live Server 확장으로 `index.html`을 실행할 수 있습니다.
