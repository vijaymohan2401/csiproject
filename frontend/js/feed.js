const uid = localStorage.uid;

let currentPage = 1;
var loading = false;
let isNextPageAvailable = true;

const loadingElement = document.getElementById("loading");
async function getNewsFeed(page) {
  loadingElement.style.display = "block";
  loading = true;
  try {
    const response = await fetch(
      `http://localhost:8000/get-newsfeed?page=${page}&includeComments=true`
    );
    const data = await response.json();

    if (data?.posts && data.posts?.length > 0) {
      data.posts.forEach((post) => {
        const date = new Date(
          post.date._seconds * 1000 +
            Math.round(post.date._nanoseconds / 1000000)
        );
        const formattedDateTime = date.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const postHTML = `<div class="central-meta item">
          <div class="user-post">
            <div class="friend-info">
              <figure>
                <img src="${
                  post?.userDetails?.profile ||
                  "./images/resources/defaultpic.jpg"
                }" alt="" class="profile-round rounded-circle" loading="lazy">
              </figure>
              <div class="friend-name">
                <ins><a  title="">${
                  post.userDetails?.nickname || "unknown user"
                }</a>
                ${
                  post.userDetails?.badges
                    ? post?.userDetails?.badges
                        ?.map(
                          (badge) =>
                            ` <img src="./images/badges/${badge}.png" class="user-badges rounded-circle" title="${badge} - badge" loading="lazy">`
                        )
                        .join("")
                    : ""
                }
                </ins>
                <span>published: ${formattedDateTime}</span>
              </div>
              <div class="post-meta">
                <ins><b style="color: #0c4a6e;">${post.title}</b></ins>
                ${(post.imageUrl && post.imageUrl !== 'null' && post.imageUrl !== 'undefined') ? `<img src="${post.imageUrl}" alt="Community Post" class='h-50' loading="lazy" style="border-radius:12px; max-height:360px; object-fit:cover; margin:8px 0; border:1px solid #e0f2fe;">` : ''}
                <div class="description">
                  <b style="color: #334155; font-weight: normal; line-height: 1.6;">${post.description}</b>
                </div>
                <div class="we-video-info">
                  <ul style="height:30px;">
                    <li>
                      <span class="like" data-toggle="tooltip" title="like">
                        <button class="like-button">
                          <div class="like-wrapper like-btn ${
                            post?.likedBy?.likes[uid] == true ? "liked" : ""
                          }" key="${post.postId}" isliked="${!!post?.likedBy
          ?.likes[uid]}">
                            <svg class="heart" width="24" height="24" viewBox="0 0 24 24">
                              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"></path>
                            </svg>
                            <div class="particles" style="--total-particles: 6">
                              <div class="particle" style="--i: 1; --color: #7642F0"></div>
                              <div class="particle" style="--i: 2; --color: #AFD27F"></div>
                              <div class="particle" style="--i: 3; --color: #DE8F4F"></div>
                              <div class="particle" style="--i: 4; --color: #D0516B"></div>
                              <div class="particle" style="--i: 5; --color: #5686F2"></div>
                              <div class="particle" style="--i: 6; --color: #D53EF3"></div>
                            </div>
                          </div>
                        </button>
                      </span>
                    </li>
                    <li>
                      <p><span class="ins like-button" key="${post.postId}">${
          post.likesCount
        }</span></p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
           ${
             post.comments?.length > 0
               ? `<div class="form-group">
              <card-with-comments class="card-with-comments" role="article" >
  <div id="commentsContainer_${post?.postId}">

    ${
      post?.comments?.length > 0
        ? `
        <div class="comments">
          <div class="comment">
            <div class="comment__header">
              <img src="${
                post.comments[0]?.commenterDetails?.profile ||
                "./images/resources/defaultpic.jpg"
              }" alt="Comment writer image" class="comment__avatar profile-round" loading="lazy">
              <p class="comment__user-name">${
                post.comments[0]?.commenterDetails?.nickname || "Unknown user"
              }</p>
              <p class="comment__time text-success">${formatTimeDifferences(
                post.comments[0].timestamp
              )}</p>
              <p class="comment__chip">Psychologist</p>
            </div>
            <p class="comment__text">${post.comments[0].comment}</p>
          </div>
          ${
            post.comments.length > 1
              ? `
              <div class="expand-comments">
                <a class="btn" onclick="toggleComments(event)">
                  View ${
                    post.comments.length - 1
                  } <i class="ti ti-angle-down"></i>
                </a>
                <div class="additional-comments" style="display: none;">
                  ${post.comments
                    .slice(1)
                    .map(
                      (comment) => `
                        <div class="comment">
                          <div class="comment__header">
                            <img src="${
                              comment?.commenterDetails?.profile ||
                              "./images/resources/defaultpic.jpg"
                            }" alt="Comment writer image" class="comment__avatar profile-round" loading="lazy">
                            <p class="comment__user-name">${
                              comment?.commenterDetails?.nickname ||
                              "Unknown user"
                            }</p>
                            <p class="comment__time text-success">${formatTimeDifferences(
                              comment.timestamp
                            )}</p>
                            <p class="comment__chip">${"Psychologist"}</p>
                          </div>
                          <p class="comment__text">${comment.comment}</p>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
              `
              : ""
          }
        </div>
        `
        : ""
    }
    </div>
     </card-with-comments>
          </div>`
               : ""
           }
        </div>`;

        document.getElementById("posts-container").innerHTML += postHTML;

        const likeButtons = document.querySelectorAll(".like-btn");
        if (uid) {
          likeButtons?.forEach((like) => {
            like.addEventListener("click", async (event) => {
              try {
                const uniqueKey = like.getAttribute("key");
                const isLiked = like.getAttribute("isliked");
                const ins = document.querySelector(`.ins[key="${uniqueKey}"]`);
                const uid = localStorage.getItem("uid");
                const queryParams = new URLSearchParams();
                queryParams.append("postid", uniqueKey);
                queryParams.append("uid", uid);
                let url;
                if (isLiked == "true") {
                  url = `http://localhost:8000/dislike-post?${queryParams.toString()}`;
                  ins.textContent = Math.max(parseInt(ins.textContent) - 1, 0);
                  like.classList.remove("liked");
                  like.setAttribute("isliked", "false");
                } else {
                  url = `http://localhost:8000/like-post?${queryParams.toString()}`;
                  ins.textContent = parseInt(ins.textContent) + 1;
                  like.classList.add("liked");
                  like.setAttribute("isliked", "true");
                }
                const response = await fetch(url, { method: "POST" });
                const result = await response.json();
                if (result.message === "Post liked successfully") {
                  like.setAttribute("isliked", "true");
                } else if (result.message === "Post disliked successfully") {
                  like.setAttribute("isliked", "false");
                } else {
                  console.error(
                    "Failed to send like request:",
                    response.statusText
                  );
                }
              } catch (error) {
                console.error("Error sending like request:", error);
              }
            });
          });
        }
      });
      });
    } else {
      renderDefaultCommunityPosts();
    }
    isNextPageAvailable = data?.isNextPageAvailable || false;
  } catch (error) {
    console.log("Displaying supportive campus coping discussions:", error);
    renderDefaultCommunityPosts();
  } finally {
    loadingElement.style.display = "none";
    loading = false;
  }
}

function renderDefaultCommunityPosts() {
  const container = document.getElementById("posts-container");
  if (!container || container.children.length > 0) return;

  const samplePosts = [
    {
      author: "Rahul Sharma",
      role: "CSE 3rd Year • COL001",
      avatar: "images/resources/defaultpic.jpg",
      time: "2 hours ago",
      title: "Box Breathing helped me clear my pre-exam tremors today",
      img: "copingtechs/BoxBreathing/assets/Coping_image/BOX BREATHING.png",
      desc: "Practiced 4 cycles of 4-4-4-4 breathing right before walking into the mid-term exam hall. My pulse settled down completely and the cognitive fog cleared. If you feel overwhelmed before tests, definitely try the guided Box Breathing in the Coping Tools tab! #BoxBreathing #ExamStress",
      likes: 38
    },
    {
      author: "Ananya Patel",
      role: "ECE 2nd Year • Active Peer",
      avatar: "images/resources/defaultpic.jpg",
      time: "4 hours ago",
      title: "5-4-3-2-1 Sensory Grounding pulls you out of anxiety spirals",
      img: "copingtechs/5-4-3-2-1/assets/Coping_image/54321.png",
      desc: "Whenever late-night study overwhelm starts creeping in, taking 3 minutes to notice 5 visual cues, 4 physical textures, and 3 sounds anchors my mind away from catastrophizing. We've got this! #Mindfulness #SensoryGrounding",
      likes: 49
    },
    {
      author: "Dr. Arun Verma",
      role: "Campus Psychologist • Wellness Cell",
      avatar: "images/counselor_hero.jpg",
      time: "Yesterday",
      title: "Clinical Insight: Combating Study Fatigue with Gentle Diaphragmatic Breaths",
      img: "images/affirmation.png",
      desc: "Prolonged desk posture often induces shallow chest breathing, which inadvertently triggers adrenaline spikes. Remember to take 10-minute screen-free breaks, breathe into your abdomen, and remember confidential counselor bookings are free in the Counselors tab. #CounselorAdvice",
      likes: 72
    }
  ];

  samplePosts.forEach((post, idx) => {
    const postDiv = document.createElement("div");
    postDiv.className = "serene-post-card";
    postDiv.innerHTML = `
      <div class="serene-post-author">
        <div class="serene-author-info">
          <img src="${post.avatar}" alt="${post.author}" class="serene-author-avatar" style="border: 2px solid #0284c7;" />
          <div class="serene-author-meta">
            <h4>${post.author}</h4>
            <span>${post.role} • ${post.time}</span>
          </div>
        </div>
        <span style="font-size: 0.75rem; background: #ecfdf5; color: #059669; font-weight: 700; padding: 3px 10px; border-radius: 20px;">Supportive Peer</span>
      </div>
      <h3 class="serene-post-title">${post.title}</h3>
      <p class="serene-post-text">${post.desc}</p>
      <div style="background: #f0f7ff; border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 1rem; border: 1px solid #e0f2fe;">
        <img src="${post.img}" alt="Coping Practice" style="max-height: 220px; max-width: 100%; border-radius: 8px; object-fit: contain;" />
      </div>
      <div class="serene-post-footer">
        <button class="serene-like-btn" onclick="this.classList.toggle('liked'); const c = this.querySelector('.count'); c.textContent = parseInt(c.textContent) + (this.classList.contains('liked') ? 1 : -1);">
          <i class="fa fa-heart" style="color: #f43f5e;"></i> <span class="count">${post.likes}</span> Likes
        </button>
        <span style="font-size: 0.8rem; color: #64748b;">
          <i class="fa fa-shield-halved" style="color: #10b981;"></i> Safe Campus Community
        </span>
      </div>
    `;
    container.appendChild(postDiv);
  });
}
function toggleComments(event) {
  const expandButton = event.target;
  const additionalComments = expandButton.nextElementSibling;

  if (additionalComments.style.display === "none") {
    additionalComments.style.display = "block";
    expandButton.innerHTML = "less <i class='ti ti-angle-up'></i> ";
  } else {
    additionalComments.style.display = "none";
    expandButton.innerHTML = `View ${additionalComments.children.length}  <i class="ti ti-angle-down"></i>`;
  }
}

window.addEventListener("scroll", async () => {
  if (
    isNextPageAvailable &&
    !loading &&
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
  ) {
    currentPage++;
    await getNewsFeed(currentPage);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  getNewsFeed(currentPage);
  dailybanner();
  const createPostForm = document.getElementById("createPostForm");
  const imagePreview = document.getElementById("imagePreview");
  var imageref = document.getElementById("image");

  imageref?.addEventListener("change", (event) => {
    imagePreview.src = URL.createObjectURL(event.target.files[0]);
    imagePreview.style.display = "block";
    imagePreview.onload = function () {
      URL.revokeObjectURL(imagePreview.src);
    };
  });
  createPostForm?.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Validate form fields
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const image1 = document.getElementById("image")?.files[0];

    const uid = localStorage.uid;
    if (!title || !description || !image1) {
      alert("Please fill in all fields");
      return;
    }

    document.getElementById("uid").value = uid;

    const formData = new FormData(this);

    try {
      const response = await fetch("http://localhost:8000/create-post", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        window.location.reload();
      } else {
        console.error("Failed to create post:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  });
});

function formatTimeDifferences(timestamp) {
  const currentTime = new Date();
  const commentTime = new Date(
    timestamp._seconds * 1000 + Math.round(timestamp._nanoseconds / 1000000)
  );
  const differenceInSeconds = Math.floor((currentTime - commentTime) / 1000);
  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  const differenceInHours = Math.floor(differenceInMinutes / 60);
  const differenceInDays = Math.floor(differenceInHours / 24);
  if (differenceInDays > 7) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return commentTime.toLocaleDateString("en-US", options);
  } else if (differenceInDays > 0) {
    return differenceInDays === 1
      ? "1 day ago"
      : `${differenceInDays} days ago`;
  } else if (differenceInHours > 0) {
    return differenceInHours === 1
      ? "1 hr ago"
      : `${differenceInHours} hrs ago`;
  } else {
    return differenceInMinutes <= 1
      ? "just now"
      : `${differenceInMinutes} mins ago`;
  }
}

async function dailybanner() {
  try {
    document.getElementById("username").innerHTML =
      "welcome " + localStorage.nickname;
    // const lastFetchedDate = localStorage.getItem("lastDailyPictureFetch");
    // const currentDate = new Date().toDateString();

    // if (!lastFetchedDate || lastFetchedDate !== currentDate) {
    //   // If the picture hasn't been fetched today, fetch it
    //   const response = await axios.get(
    //     "http://localhost:8000/fetch-daily-picture"
    //   );

    //   if (response.data && response.data.imageUrl) {
    //     // Store the image URL in local storage
    //     localStorage.setItem("dailyPictureUrl", response.data.imageUrl);

    //     // Update the flag in local storage to indicate that the picture has been fetched today
    //     localStorage.setItem("lastDailyPictureFetch", currentDate);

    //     // Replace the banner with the fetched image
    //     const bannerElement = document.getElementById("banner");
    //     if (bannerElement) {
    //       bannerElement.src = response.data.imageUrl;
    //     }
    //   }
    // } else {
    //   // If the picture has already been fetched today, use the stored image URL
    //   const storedImageUrl = localStorage.getItem("dailyPictureUrl");
    //   if (storedImageUrl) {
    //     const bannerElement = document.getElementById("banner");
    //     if (bannerElement) {
    //       bannerElement.src = storedImageUrl;
    //     }
    //   }
    // }
  } catch (error) {
    console.error("Error fetching or displaying daily picture:", error);
  }
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("like-btn")) {
    const button = event.target;
    const isLiked = button.getAttribute("isliked") === "true";
    if (isLiked) {
      button.classList.remove("liked");
      button.setAttribute("isliked", "false");
      const likeCount = button.nextElementSibling.querySelector(".ins");
      likeCount.textContent = parseInt(likeCount.textContent) - 1;
    } else {
      button.classList.add("liked");
      button.setAttribute("isliked", "true");
      const likeCount = button.nextElementSibling.querySelector(".ins");
      likeCount.textContent = parseInt(likeCount.textContent) + 1;
    }
  }
});
