# Node 20.19 사용
FROM node:20.19-alpine

# ffmpeg 설치 (youtubei.js 스트림 병합용)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 패키지 파일 복사
COPY package.json yarn.lock ./

# 의존성 설치
RUN yarn install --frozen-lockfile --ignore-engines

# 소스 복사
COPY . .

# 프론트엔드 빌드
RUN yarn build

# youtubei.js 캐시 디렉토리 생성 (decipher에 필요)
RUN mkdir -p .cache && chmod 777 .cache

# 환경변수
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 서버 시작
CMD ["npx", "tsx", "server/index.ts"]

