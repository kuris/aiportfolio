# 김진형 AI 활용 강사 포트폴리오 랜딩페이지

현직 PM · AI 활용 강사 **김진형**의 강의 소개 및 문의를 위한 원페이지 랜딩 사이트입니다.
"코딩을 몰라도 AI로 나만의 웹사이트를 만드는 방법"을 알리는 것을 목표로 하며,
**도서관·문화센터·평생학습관·주민센터** 등 공공기관 담당자가 신뢰할 수 있도록
과장 없는 실무형·교육형 톤으로 구성했습니다.

## ✅ 완료된 기능

- **Header / Nav**: 상단 고정 네비게이션(자격·경험 메뉴 추가), 모바일 햄버거 메뉴, 스크롤 시 그림자 효과
- **Hero Section**: "코딩 몰라도 AI로 나만의 웹사이트 만들기"가 가장 큰 제목으로 표시, 그 아래 설명 문구 → 배지 4종(현직 PM / AI 활용 강사 / 정보처리기사 / AICE Associate 준비 중) → CTA 2종(강의 문의하기 / 제작 사례 보기, 각각 해당 섹션으로 스크롤 이동) 순서로 배치
- **About Section**: 강사 소개 문구, 핵심 키워드 카드 6종(현직 PM / 정보처리기사 / AI 도구 활용 / 웹사이트·앱 제작 경험 / 실습형 강의 / 교육형 콘텐츠 제작)
- **Portfolio Section (강화)**: 3개 대표 프로젝트를 큰 카드로 구성, 각 카드에 설명 + 주요 기능 태그 + "사이트 보기" 버튼, hover 시 떠오르는 효과
  - 역사 학습 웹서비스 (history.chatgpts.kr)
  - 영어 문법 학습 웹서비스 (gram.chatgpts.kr)
  - 한자 학습 웹서비스 (hanja.chatgpts.kr)
- **Credentials Section (신규)**: 자격 및 경험 6개 항목을 카드 리스트로 정리 (정보처리기사, SCJP, AICE Associate 준비 중 등)
- **Course Section**: 대표 강의(2시간 원데이 특강) 6단계 커리큘럼(번호 배지 1개만 사용, 중복 번호 표시 없음), 추천 대상 4종, 후속 심화 강의 4종
- **Features Section**: 강의 특징 4가지 카드 (실습 중심 / 초보자 친화 / 실제 운영 사례 / 결과물 완성 목표)
- **Contact Section**: 실제 이메일(phiskim@gmail.com)로 연결, 강의계획서·강사 프로필 제공 안내 문구, 메일 문의 CTA
- **Footer**: 저작권 및 3개 제작 사례 링크
- **디자인**: 화이트/블루/민트 톤의 연한 그라데이션 배경, 카드형 UI, pill 버튼, 부드러운 hover 효과만 사용(과한 애니메이션 없음)
- **반응형**: 데스크톱·모바일 스크린샷 검증 완료 (포트폴리오 카드 1열 스택, 자격 그리드, 문의 섹션 모두 정상)

## 🌐 페이지 구성 (단일 페이지, 앵커 이동)

| 구간 | 앵커 ID |
|---|---|
| Hero | `#hero-section` |
| About | `#about-section` |
| Portfolio | `#portfolio-section` |
| Credentials | `#credentials-section` |
| Course | `#course-section` |
| Features | `#features-section` |
| Contact | `#contact-section` |

외부 링크(제작 사례):
- https://history.chatgpts.kr (역사 학습 웹서비스)
- https://gram.chatgpts.kr (영어 문법 학습 웹서비스)
- https://hanja.chatgpts.kr (한자 학습 웹서비스)

## 📁 파일 구조

```
index.html        메인 랜딩 페이지 (전체 7개 섹션 포함)
css/style.css      커스텀 스타일 (Tailwind 보완: 그라데이션 배경, 프로젝트 카드, 자격 리스트, 배지 등)
js/main.js         모바일 메뉴 토글, 헤더 스크롤 효과
README.md          프로젝트 문서
```

## 🚧 아직 구현되지 않은 기능

- 실제 문의 폼(이메일 전송) — 현재는 `mailto:phiskim@gmail.com` 링크로 메일 클라이언트를 여는 방식
- 강의 신청/예약 자동화 (정적 사이트 한계로 별도 폼 서비스 연동 필요, 예: Google Forms, Tally 등)
- 강의계획서/강사 프로필 PDF 다운로드 (현재는 "요청 시 전달" 문구만 안내, 정적 사이트에서 직접 파일을 올려 링크로 제공하는 것은 가능)
- 문의 접수 기록 저장 (필요 시 RESTful Table API로 문의 내역 테이블 추가 가능)

## 💡 다음 개발 추천 단계

1. 강의계획서/강사 프로필 PDF 파일이 준비되면 `files/` 폴더에 업로드 후 Contact 섹션에 다운로드 링크 추가
2. 필요 시 Google Forms 등 외부 폼 서비스를 Contact 섹션에 iframe/링크로 연동
3. 문의 접수 기록이 필요하면 `inquiries` 테이블(Table API)을 만들어 이름/연락처/문의내용을 저장하는 간단한 폼 추가
4. 강의 후기/수강 기관 사례가 쌓이면 Testimonial(수강 후기) 섹션 추가 고려
5. Publish 탭에서 배포 후 커스텀 도메인 연결 검토

## 🎨 디자인

- 톤: 과장 없는 실무형·교육형·친근한 느낌. 공공기관 강의 제안에 어울리는 신뢰감 있는 강사 페이지
- 색상: 화이트 · 소프트 블루 · 민트의 연한 그라데이션
- 폰트: Noto Sans KR (Google Fonts)
- 프레임워크/라이브러리: Tailwind CSS (CDN), Font Awesome (CDN)
- 구성 요소: 카드형 레이아웃(프로젝트/자격/특징), pill 버튼, 배지, 부드러운 hover 효과, 모바일 플로팅 문의 버튼

## ⚠️ 주의 사항 (반영됨)

- 회사명, 병원명, 내부 업무 관련 내용 미포함
- "수익 보장", "AI 전문가", "국가공인 AI 강사" 등 과장 표현 미사용
- 관리자/로그인/내부용 버튼 없음
- 문의 이메일은 placeholder 없이 `phiskim@gmail.com`으로 확정 반영

## 💾 데이터 저장

현재 별도의 테이블/데이터베이스는 사용하지 않는 순수 정적 페이지입니다.
문의 폼이나 방문자 로그 등 데이터 저장이 필요해지면 RESTful Table API(`tables/{table}`)를 통해 추가할 수 있습니다.

## 🔗 공개 URL

배포는 **Publish 탭**에서 진행해 주세요. Publish 탭에서 한 번의 클릭으로 배포를 완료하고 실제 접속 가능한 웹사이트 URL을 받을 수 있습니다.
