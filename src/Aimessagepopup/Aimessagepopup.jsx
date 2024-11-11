import React, { useState } from 'react';
import './Aimessagepopup.css';

function AiMessagePopup({ closePopup, setAiMessage }) {
  const [purposeContent, setPurposeContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [organization, setOrganization] = useState('');
  const [mood, setMood] = useState('');
  const [otherInfo, setOtherInfo] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generatedGIFs, setGeneratedGIFs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [gif, setGif] = useState('');
  const [subject, setSubject] = useState('');
  const [action, setAction] = useState('');
  const [location, setLocation] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result.split(',')[1]); // Base64 인코딩된 이미지 설정
    };
    if (file) {
      reader.readAsDataURL(file); // 파일을 Base64로 읽어들임
    }
  };

  const handleGenerateMessage = async () => {
    if (!purposeContent || !keywords) {
      alert('발송목적 및 주요 키워드를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);

    const userInput = {
      purposeContent,
      keywords: keywords.split(',').map(keyword => keyword.trim()),  // keywords를 배열로 변환
    };

    try {
      // API 요청
      const response = await fetch('http://localhost:8080/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInput),
      });

      if (!response.ok) {
        throw new Error('문자 생성에 실패했습니다.');
      }

      // 응답 데이터 처리
      const data = await response.json();
      console.log("API 응답:", data);  // 응답 데이터 확인

      // 생성된 메시지를 적절히 가져옴
      const generatedMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (generatedMessage) {
        setGeneratedMessage(generatedMessage);
      } else {
        setGeneratedMessage("생성된 텍스트가 없습니다.");
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
};

  const handleRegenerateMessage = () => {
    handleGenerateMessage();
  };

  const handleUseMessage = () => {
    if (generatedMessage) {
      setActiveTab('image');
      setPurposeContent(generatedMessage);
    }
  };

  const handleGenerateImage = async () => {
    if (!purposeContent) {
      alert('문자 내용을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setGeneratedGIFs([]); // GIF 생성 결과를 초기화
    setGeneratedImages([]); // 이미지 생성 결과를 초기화

    const imageDTO = {
      message: purposeContent,
      concept: mood,
      base64Image: referenceImage,
    };

    try {
      const response = await fetch('http://localhost:8080/api/createImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageDTO),
      });

      if (!response.ok) {
        throw new Error('이미지 생성에 실패했습니다.');
      }

      const data = await response.json();
      const imageUrls = data.map(url => {
        const imageName = url.split('\\').pop();
        return `http://localhost:8080/api/images/${imageName}`;
      });

      setGeneratedImages(imageUrls);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGIF = async () => {
    // 애니 유형이 아닌 경우, 문자 내용이 필수로 필요
    if (gif !== '애니' && !purposeContent) {
      alert('문자 내용을 입력해 주세요.');
      return;
    }
  
    // 애니 유형인 경우, 피사체, 행동, 장소만 필요
    if (gif === '애니' && (!subject || !action || !location)) {
      alert('피사체, 행동, 장소를 모두 입력해 주세요.');
      return;
    }
  
    setIsLoading(true);
    setGeneratedImages([]); // 이미지 생성 결과를 초기화
    setGeneratedGIFs([]); // GIF 생성 결과를 빈 배열로 초기화
  
    const gifDTO = {
      category: gif, // gif 유형 (확대, 축소, 팝, 애니 등)
      message: gif === '애니' ? '' : purposeContent,  // "애니" 유형일 경우 문자 내용은 빈 문자열
      concept: gif === '애니' ? '' : mood,           // "애니" 유형일 경우 분위기는 빈 문자열
      who: gif === '애니' ? subject : '',            // "애니" 유형일 경우 피사체만 포함
      move: gif === '애니' ? action : '',            // "애니" 유형일 경우 행동만 포함
      where: gif === '애니' ? location : '',         // "애니" 유형일 경우 장소만 포함
      base64Image: referenceImage,                    // 사용자가 업로드한 이미지 (필요한 경우)
    };
  
    try {
      const response = await fetch('http://localhost:8080/api/createGIF', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gifDTO),
      });
  
      if (!response.ok) {
        throw new Error('GIF 생성에 실패했습니다.');
      }
  
      const data = await response.json();
  
      // data가 배열이며, data[0]이 정의되어 있는지 확인
      if (data && Array.isArray(data.imageUrl) && data.imageUrl[0]) {
        const gifUrl = data.imageUrl[0]; // 첫 번째 URL을 받음
        setGeneratedGIFs([gifUrl]); // 단일 GIF URL도 배열로 설정

      } else {
        alert('GIF 생성에 실패했습니다. 반환된 데이터가 올바르지 않습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleSend = () => {
    if (selectedImage && purposeContent) {
      setAiMessage({ purposeContent, selectedImage });
      closePopup();
    } else {
      alert('문자 내용과 이미지를 선택해주세요.');
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <span onClick={() => closePopup()}>X 닫기</span>
        <span className={activeTab === 'text' ? 'active' : ''} onClick={() => setActiveTab('text')}>
          AI 문자 생성
        </span>
        <span className={activeTab === 'image' ? 'active' : ''} onClick={() => setActiveTab('image')}>
          AI 이미지 생성
        </span>
        <span className={activeTab === 'gif' ? 'active' : ''} onClick={() => setActiveTab('gif')}>
          AI gif 생성
        </span>
      </div>

      <div className="popup-content">
        {/* 문자 생성 탭 */}
        {activeTab === 'text' && (
          <div className="text-section">
            <div className="left-section">
              <div className="input-section">
                <label>발송 목적 및 내용</label>
                <textarea
                  value={purposeContent}
                  onChange={(e) => setPurposeContent(e.target.value)}
                  placeholder="예시: 결혼식 청첩장 발송"
                />
              </div>

              <div className="input-section">
                <label>주요 키워드</label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="예시: 할인혜택, 신제품출시"
                />
              </div>

              <button onClick={handleGenerateMessage} disabled={isGenerating}>
                {isGenerating ? '문자 생성 중...' : '문자 생성'}
              </button>
              <button onClick={handleRegenerateMessage} disabled={!generatedMessage}>
                다시 생성
              </button>
            </div>
            <div className="right-section">
              <div className="result-section">
                <label>생성 결과</label>
                <textarea
                  value={generatedMessage}
                  readOnly
                  placeholder="여기에 생성된 결과가 표시됩니다."
                />
              </div>


              <button onClick={handleUseMessage} disabled={!generatedMessage}>
                이 문자 사용하기
              </button>
              <button onClick={() => { setAiMessage({ purposeContent: generatedMessage }); closePopup(); }}>
                문자만 보낼래요
              </button>
            </div>
          </div>
        )}

        {/* 이미지 생성 탭 */}
        {activeTab === 'image' && (
          <div className="text-section">
            <div className="left-section">
              <div className="input-section">
                <label>문자 내용 입력</label>
                <textarea
                  value={generatedMessage}
                  onChange={(e) => setPurposeContent(e.target.value)}
                  placeholder="여기에 문자를 입력하세요."
                />
              </div>

              <div className="input-section">
                <label>조직</label>
                <select value={organization} onChange={(e) => setOrganization(e.target.value)}>
                  <option value="">선택하세요</option>
                  <option value="유치원">유치원</option>
                  <option value="교회">교회</option>
                  <option value="동호회">동호회</option>
                </select>
              </div>

              <div className="input-section">
                <label>분위기</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)}>
                  <option value="">선택하세요</option>
                  <option value="세련된">세련된</option>
                  <option value="따듯한">따듯한</option>
                  <option value="극사실주의">극사실주의</option>
                  <option value="복고풍">복고풍</option>
                  <option value="차가운">차가운</option>
                  <option value="무서운">무서운</option>
                  <option value="귀여운">귀여운</option>
                </select>
              </div>

              <div className="input-section">
                <label>기타</label>
                <input
                  type="text"
                  value={otherInfo}
                  onChange={(e) => setOtherInfo(e.target.value)}
                  placeholder="기타 정보를 입력하세요."
                />
              </div>

              <div className="input-section">
                <label>저희가 참고할 이미지를 첨부해주세요 (선택)</label>
                <input type="file" onChange={handleFileChange} />
              </div>

              <button onClick={handleGenerateImage} disabled={isLoading}>
                {isLoading ? '이미지 생성 중...' : '이미지 생성하기'}
              </button>
            </div>

            <div className="right-section">
              <label>이미지 생성</label>
              {generatedImages.length > 0 ? (
                <div className="image-grid">
                  {generatedImages.map((image, index) => (
                    <div key={index} className={`image-container ${selectedImage === image ? 'selected' : ''}`}>
                      <img src={image} alt={`Generated ${index}`} onClick={() => handleImageSelect(image)} />
                    </div>
                  ))}
                </div>
              ) : (
                <p>생성된 이미지가 없습니다.</p>
              )}

              <button onClick={handleSend} disabled={!selectedImage || !purposeContent}>
                이미지와 문자 전송하기
              </button>
            </div>
          </div>
        )}

        {/* GIF 생성 탭 */}
        {activeTab === 'gif' && (
          <div className="text-section">
            <div className="left-section">
              <div className="input-section">
                <label>gif 유형</label>
                <select value={gif} onChange={(e) => setGif(e.target.value)}>
                  <option value="">선택하세요</option>
                  <option value="확대">확대</option>
                  <option value="축소">축소</option>
                  <option value="팝">팝</option>
                  <option value="애니">애니</option>
                </select>
              </div>

              {gif === '애니' ? (
                <>
                  <div className="input-section">
                    <label>피사체</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="피사체를 입력하세요."
                    />
                  </div>
                  <div className="input-section">
                    <label>행동</label>
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      placeholder="행동을 입력하세요."
                    />
                  </div>
                  <div className="input-section">
                    <label>장소</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="장소를 입력하세요."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="input-section">
                    <label>문자 내용 입력</label>
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setPurposeContent(e.target.value)}
                      placeholder="여기에 문자를 입력하세요."
                    />
                  </div>

                  <div className="input-section">
                    <label>분위기</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                      <option value="">선택하세요</option>
                      <option value="세련된">세련된</option>
                      <option value="따듯한">따듯한</option>
                      <option value="극사실주의">극사실주의</option>
                      <option value="복고풍">복고풍</option>
                      <option value="차가운">차가운</option>
                      <option value="무서운">무서운</option>
                      <option value="귀여운">귀여운</option>
                    </select>
                  </div>
                </>
              )}

              <button onClick={handleGenerateGIF} disabled={isLoading}>
                {isLoading ? 'GIF 생성 중...' : 'GIF 생성하기'}
              </button>
            </div>

            <div className="right-section">
              <label>GIF 생성</label>
              {generatedGIFs.length > 0 ? (
                <div className="image-grid">
                  {generatedGIFs.map((image, index) => (
                    <div key={index} className={`image-container ${selectedImage === image ? 'selected' : ''}`}>
                      <img src={image} alt={`Generated ${index}`} onClick={() => handleImageSelect(image)} />
                    </div>
                  ))}
                </div>
              ) : (
                <p>생성된 GIF가 없습니다.</p>
              )}

              <button onClick={handleSend} disabled={!selectedImage || !purposeContent}>
                GIF와 문자 전송하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiMessagePopup;
