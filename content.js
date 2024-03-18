function initScoreDisplay() {
  fetchData().then(({ score, percentage }) => {
    displayScoreAndPercentage(score, percentage);
  });
}

initScoreDisplay();

function calculatePosterScore(followers, totalPosts, accountCreationDate) {
  console.log("followers:", followers);
  console.log("totalPosts:", totalPosts);
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(accountCreationDate)) / (1000 * 60 * 60 * 24)
  );
  console.log("daysSinceAcctCreation:", daysSinceCreation);
  const score = (followers * totalPosts) / daysSinceCreation;
  return score;
}

async function getPostsNumber() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const regex = /(\d{1,3}(?:,\d{3})*|\d+\.\d+)(K)?\sPosts/i;
      const pageContent = document.body.innerText;
      const match = pageContent.match(regex);

      if (match) {
        clearInterval(interval);
        let postsNumber = 0;
        if (match[2] === "K") {
          // If the number is in thousands
          postsNumber = parseFloat(match[1].replace(/,/g, "")) * 1000;
        } else {
          // If the number is not in thousands
          postsNumber = parseInt(match[1].replace(/,/g, ""), 10);
        }
        resolve(postsNumber);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      reject("Failed to find posts number within timeout.");
    }, 10000); // Timeout after 10 seconds
  });
}

async function getFollowersCount() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const followersElement = Array.from(
        document.querySelectorAll("a > span > span")
      ).find((span) => span.textContent.includes("Followers"));
      if (
        followersElement &&
        followersElement.parentElement &&
        followersElement.parentElement.previousElementSibling
      ) {
        clearInterval(interval);
        let countText =
          followersElement.parentElement.previousElementSibling.textContent.replace(
            /,/g,
            ""
          ); // Remove commas
        let count = 0;
        if (countText.endsWith("K")) {
          count = parseFloat(countText) * 1000; // Convert "K" to actual number
        } else if (countText.endsWith("M")) {
          count = parseFloat(countText) * 1000000; // Convert "M" to actual number
        } else {
          count = parseFloat(countText);
        }
        resolve(count);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      reject("Failed to find followers count within timeout.");
    }, 10000); // Timeout after 10 seconds
  });
}

async function getAccountCreationDate() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const regex = /Joined\s+\w+\s+\d{4}/i;
      const pageContent = document.body.innerText;
      const match = pageContent.match(regex);

      if (match) {
        clearInterval(interval);
        const joinedText = match[0];
        const [joined, month, year] = joinedText.split(" ");
        const date = new Date(`${month} 1, ${year}`);
        resolve(date); // Resolve the promise with the date
      }
    }, 500);
    setTimeout(() => {
      clearInterval(interval);
      reject("Failed to find account creation date within timeout.");
    }, 10000); // Timeout after 10 seconds
  });
}

async function fetchData() {
  let scoreCalculated = false;
  let score = 0;
  let percentage = 0;
  while (!scoreCalculated) {
    try {
      // Wait for all promises to resolve and destructure their resolved values
      const [accountCreationDate, followersCount, postsNumber] =
        await Promise.all([
          getAccountCreationDate(),
          getFollowersCount(),
          getPostsNumber(),
        ]);

      // Ensure all values are correctly retrieved before calculating the score
      if (accountCreationDate && followersCount && postsNumber) {
        score = calculatePosterScore(
          followersCount,
          postsNumber,
          accountCreationDate
        );
        function mapScoreToPercentage(score) {
          let percentage;
          if (score < 100) {
            return 1; // Score is less than 100, map to 1%
          } else if (score >= 100 && score < 1000) {
            // Map 100-1000 to 1-25%
            percentage = mapLinear(score, 100, 1000, 1, 25);
          } else if (score >= 1000 && score < 10000) {
            // Map 1000-10000 to 26-50%
            percentage = mapLinear(score, 1000, 10000, 26, 50);
          } else if (score >= 10000 && score < 100000) {
            // Map 10000-100000 to 51-75%
            percentage = mapLinear(score, 10000, 100000, 51, 75);
          } else if (score >= 100000 && score < 1000000) {
            // Map 100000-1000000 to 76-100%
            percentage = mapLinear(score, 100000, 1000000, 76, 100);
          } else {
            // Score is greater than or equal to 1000000, map to 100%
            return 100;
          }
          return percentage === 1 || percentage === 100
            ? percentage
            : parseFloat(percentage.toFixed(2));
        }

        function mapLinear(x, x1, x2, y1, y2) {
          return ((x - x1) / (x2 - x1)) * (y2 - y1) + y1;
        }
        percentage = mapScoreToPercentage(score);
        scoreCalculated = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 1 second before retrying
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 1 second before retrying
    }
  }
  return { score, percentage };
}

function displayScoreAndPercentage(score, percentage) {
  const roundedScore = Math.round(score); // Round the score to the nearest integer
  const formattedScore = roundedScore.toLocaleString(); // Format the score with commas

  const usernameDiv = document.querySelector('div[data-testid="UserName"]');
  if (usernameDiv) {
    // Navigate to the target location
    const targetLocation = usernameDiv.children[0].children[0].children[0];

    // Remove existing score display if it exists
    const existingScoreDiv = document.querySelector("#scoreDisplay");
    if (existingScoreDiv) {
      existingScoreDiv.remove();
    }

    // Create a new div to display the score and percentage
    const scoreDiv = document.createElement("div");
    scoreDiv.id = "scoreDisplay"; // Assign an ID to the new div
    scoreDiv.textContent = `Score: ${formattedScore}`;
    scoreDiv.style.color = "rgb(29, 155, 240)"; // Example styling, adjust as needed
    scoreDiv.style.font =
      '14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

    // Create a span element that will be shown on hover
    const infoSpan = document.createElement("span");
    infoSpan.textContent =
      "Score = # Followers X # Posts / # Days Since Account Creation";
    infoSpan.style.display = "none"; // Initially hidden
    infoSpan.style.color = "rgb(29, 155, 240)";
    infoSpan.style.font =
      '14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

    // Show the span on hover
    scoreDiv.addEventListener("mouseenter", () => {
      infoSpan.style.display = "inline";
    });
    scoreDiv.addEventListener("mouseleave", () => {
      infoSpan.style.display = "none";
    });

    // Append a br element before appending the info span to the score div
    const breakElement = document.createElement("br");
    scoreDiv.appendChild(breakElement);
    scoreDiv.appendChild(infoSpan);

    // Insert the new div
    targetLocation.appendChild(scoreDiv);
  } else {
    console.error("Failed to find UserName.");
  }
}

// Function to call when URL changes
function onUrlChange() {
  initScoreDisplay(); // Re-initialize the score display
}

// Set up a MutationObserver to call onUrlChange on URL change
const observer = new MutationObserver((mutations, obs) => {
  const newUrl = location.href;
  if (newUrl !== currentUrl) {
    currentUrl = newUrl; // Update the current URL
    onUrlChange();
  }
});

// Current URL to compare against for changes
let currentUrl = location.href;

// Start observing the body for attribute changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
