/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 * Updated for Dual Canvas (Game vs Webcam)
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let gameCtx; // 게임 화면 Context
let webcamCtx; // 웹캠 화면 Context
let labelContainer;

/**
 * 애플리케이션 초기화
 */
async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.disabled = true;

  try {
    // 1. Canvas 설정 (게임용 & 웹캠용 분리)
    const gameCanvas = document.getElementById("game-canvas");
    gameCanvas.width = 600;
    gameCanvas.height = 600;
    gameCtx = gameCanvas.getContext("2d");

    const webcamCanvas = document.getElementById("webcam-canvas");
    webcamCanvas.width = 200;
    webcamCanvas.height = 200;
    webcamCtx = webcamCanvas.getContext("2d");

    // 2. PoseEngine 초기화 (웹캠은 작게 유지)
    poseEngine = new PoseEngine("./my_model/");
    const { maxPredictions, webcam } = await poseEngine.init({
      size: 200, // 웹캠은 200px로 충분
      flip: true
    });

    // 3. Stabilizer 초기화
    stabilizer = new PredictionStabilizer({
      threshold: 0.7,
      smoothingFrames: 3
    });

    // 4. GameEngine 초기화
    gameEngine = new GameEngine();

    // 5. Label Container 설정
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    // 6. PoseEngine 콜백 설정
    poseEngine.setPredictionCallback(handlePrediction);
    poseEngine.setDrawCallback(drawPose);

    // 7. PoseEngine 시작
    poseEngine.start();

    // 8. 게임 시작 (바로 시작)
    gameEngine.start({ timeLimit: 60 });

    stopBtn.disabled = false;
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. 콘솔을 확인하세요.");
    startBtn.disabled = false;
  }
}

/**
 * 애플리케이션 중지
 */
function stop() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (poseEngine) {
    poseEngine.stop();
  }

  if (gameEngine && gameEngine.isGameActive) {
    gameEngine.stop();
  }

  if (stabilizer) {
    stabilizer.reset();
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

/**
 * 예측 결과 처리 콜백
 */
function handlePrediction(predictions, pose) {
  // 1. Stabilizer로 예측 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 2. Label Container 업데이트
  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // 3. 최고 확률 예측 표시
  const maxPredictionDiv = document.getElementById("max-prediction");
  maxPredictionDiv.innerHTML = stabilized.className || "감지 중...";

  // 4. GameEngine에 포즈 전달
  if (gameEngine && gameEngine.isGameActive && stabilized.className) {
    gameEngine.onPoseDetected(stabilized.className);
  }
}

/**
 * 포즈 그리기 콜백
 * @param {Object} pose - PoseNet 포즈 데이터
 */
function drawPose(pose) {
  // 1. 웹캠 화면 그리기 (오른쪽 작은 화면)
  if (poseEngine.webcam && poseEngine.webcam.canvas) {
    webcamCtx.drawImage(poseEngine.webcam.canvas, 0, 0);

    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, webcamCtx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, webcamCtx);
    }
  }

  // 2. 게임 화면 그리기와 업데이트 (왼쪽 큰 화면)
  if (gameEngine && gameEngine.isGameActive) {
    // 배경 지우기 (흰색)
    gameCtx.fillStyle = "#F0F8FF"; // AliceBlue Background
    gameCtx.fillRect(0, 0, 600, 600);

    // 게임 렌더링
    gameEngine.update();
    gameEngine.render(gameCtx);
  }
}

// startGameMode 함수는 이제 직접 호출되지 않으므로 제거하거나 남겨둠
