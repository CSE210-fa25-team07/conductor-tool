// Standup Form Page - Student submits daily standup
// NO STYLING - Pure HTML elements only

import { currentUser, mockTeams } from './mockData.js';

export function renderStandupForm(containerId) {
  const container = document.getElementById(containerId);

  // Clear container
  container.innerHTML = '';

  // Header
  const header = document.createElement('h1');
  header.textContent = 'Daily Standup';
  container.appendChild(header);

  // User info
  const userInfo = document.createElement('p');
  userInfo.textContent = `Logged in as: ${currentUser.name} (${currentUser.email})`;
  container.appendChild(userInfo);

  // Date info
  const dateInfo = document.createElement('p');
  dateInfo.textContent = `Date: ${new Date().toLocaleDateString()}`;
  container.appendChild(dateInfo);

  // Form
  const form = document.createElement('form');
  form.id = 'standup-form';

  // Question 1: What did you accomplish yesterday?
  const q1Label = document.createElement('label');
  q1Label.textContent = '1. What did you accomplish yesterday?';
  form.appendChild(q1Label);

  form.appendChild(document.createElement('br'));

  const q1Textarea = document.createElement('textarea');
  q1Textarea.id = 'what-done';
  q1Textarea.name = 'what-done';
  q1Textarea.rows = 5;
  q1Textarea.cols = 80;
  q1Textarea.placeholder = 'Describe what you accomplished...';
  form.appendChild(q1Textarea);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Mock GitHub auto-populate button
  const githubBtn = document.createElement('button');
  githubBtn.type = 'button';
  githubBtn.textContent = 'Auto-populate from GitHub (last 24h)';
  githubBtn.onclick = () => {
    q1Textarea.value = 'MOCK GITHUB DATA:\n- Commit: Fixed login bug (3 hours ago)\n- Commit: Updated README (5 hours ago)\n- PR Review: Reviewed PR #42 for authentication (6 hours ago)';
  };
  form.appendChild(githubBtn);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Question 2: What will you work on today?
  const q2Label = document.createElement('label');
  q2Label.textContent = '2. What will you work on today?';
  form.appendChild(q2Label);

  form.appendChild(document.createElement('br'));

  const q2Textarea = document.createElement('textarea');
  q2Textarea.id = 'what-next';
  q2Textarea.name = 'what-next';
  q2Textarea.rows = 5;
  q2Textarea.cols = 80;
  q2Textarea.placeholder = 'Describe your plans for today...';
  form.appendChild(q2Textarea);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Question 3: Any blockers?
  const q3Label = document.createElement('label');
  q3Label.textContent = '3. Any blockers?';
  form.appendChild(q3Label);

  form.appendChild(document.createElement('br'));

  const q3Textarea = document.createElement('textarea');
  q3Textarea.id = 'blockers';
  q3Textarea.name = 'blockers';
  q3Textarea.rows = 3;
  q3Textarea.cols = 80;
  q3Textarea.placeholder = 'Describe any blockers (leave empty if none)...';
  form.appendChild(q3Textarea);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Reflection (optional)
  const reflectionLabel = document.createElement('label');
  reflectionLabel.textContent = 'Personal reflection (optional):';
  form.appendChild(reflectionLabel);

  form.appendChild(document.createElement('br'));

  const reflectionTextarea = document.createElement('textarea');
  reflectionTextarea.id = 'reflection';
  reflectionTextarea.name = 'reflection';
  reflectionTextarea.rows = 3;
  reflectionTextarea.cols = 80;
  reflectionTextarea.placeholder = 'How are you feeling about the project?';
  form.appendChild(reflectionTextarea);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Sentiment emoji selector
  const sentimentLabel = document.createElement('label');
  sentimentLabel.textContent = 'How are you feeling today?';
  form.appendChild(sentimentLabel);

  form.appendChild(document.createElement('br'));

  const sentiments = [
    { emoji: '😄', score: 1.0, label: 'Very Happy' },
    { emoji: '😊', score: 0.7, label: 'Happy' },
    { emoji: '🙂', score: 0.5, label: 'Good' },
    { emoji: '😐', score: 0.0, label: 'Neutral' },
    { emoji: '😕', score: -0.3, label: 'Concerned' },
    { emoji: '😞', score: -0.7, label: 'Sad' }
  ];

  const sentimentDiv = document.createElement('div');
  sentimentDiv.id = 'sentiment-selector';

  let selectedSentiment = null;

  sentiments.forEach(sentiment => {
    const radioInput = document.createElement('input');
    radioInput.type = 'radio';
    radioInput.name = 'sentiment';
    radioInput.value = sentiment.score;
    radioInput.id = `sentiment-${sentiment.score}`;

    const radioLabel = document.createElement('label');
    radioLabel.htmlFor = `sentiment-${sentiment.score}`;
    radioLabel.textContent = `${sentiment.emoji} ${sentiment.label}`;

    radioInput.onchange = () => {
      selectedSentiment = {
        score: sentiment.score,
        emoji: sentiment.emoji
      };
    };

    sentimentDiv.appendChild(radioInput);
    sentimentDiv.appendChild(radioLabel);
    sentimentDiv.appendChild(document.createElement('br'));
  });

  form.appendChild(sentimentDiv);

  form.appendChild(document.createElement('br'));

  // Visibility selector
  const visibilityLabel = document.createElement('label');
  visibilityLabel.textContent = 'Who can see this standup?';
  form.appendChild(visibilityLabel);

  form.appendChild(document.createElement('br'));

  const visibilitySelect = document.createElement('select');
  visibilitySelect.id = 'visibility';
  visibilitySelect.name = 'visibility';

  ['Team', 'Instructor', 'Private'].forEach(vis => {
    const option = document.createElement('option');
    option.value = vis;
    option.textContent = vis;
    if (vis === 'Team') option.selected = true;
    visibilitySelect.appendChild(option);
  });

  form.appendChild(visibilitySelect);

  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  // Buttons
  const saveDraftBtn = document.createElement('button');
  saveDraftBtn.type = 'button';
  saveDraftBtn.textContent = 'Save Draft';
  saveDraftBtn.onclick = () => {
    alert('Draft saved! (mock action)');
  };
  form.appendChild(saveDraftBtn);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Submit Standup';
  form.appendChild(submitBtn);

  // Form submit handler
  form.onsubmit = (e) => {
    e.preventDefault();

    const formData = {
      what_done: q1Textarea.value,
      what_next: q2Textarea.value,
      blockers: q3Textarea.value,
      reflection: reflectionTextarea.value,
      sentiment_score: selectedSentiment?.score || 0,
      sentiment_emoji: selectedSentiment?.emoji || '😐',
      visibility: visibilitySelect.value,
      date_submitted: new Date().toISOString()
    };

    console.log('Standup submitted:', formData);
    alert(`Standup submitted successfully!\n\nSentiment: ${formData.sentiment_emoji}\nVisibility: ${formData.visibility}`);

    // Clear form
    form.reset();
  };

  container.appendChild(form);

  // Display submission time estimate
  const timeEstimate = document.createElement('p');
  timeEstimate.textContent = 'Estimated time to complete: < 2 minutes';
  container.appendChild(timeEstimate);
}
