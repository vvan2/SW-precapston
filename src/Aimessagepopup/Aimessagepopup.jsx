import React, { useState } from 'react';
import './Aimessagepopup.css';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/loading.json';

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

  // 세션 확인 함수
  const isSessionValid = () => {
    const username = sessionStorage.getItem('username');
    return Boolean(username); // 세션이 유효하면 true 반환
  };

  const handleFileChange = (e) => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
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
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    if (!purposeContent || !keywords) {
      alert('발송목적 및 주요 키워드를 입력해 주세요.');
      return;
    }

    setIsGenerating(true);

    const userInput = {
      purposeContent,
      keywords: keywords.split(',').map((keyword) => keyword.trim()), // keywords를 배열로 변환
    };

    try {
      // API 요청
      const response = await fetch('http://13.239.36.154:8080/api/generate-message', {
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
      console.log('API 응답:', data); // 응답 데이터 확인

      // 생성된 메시지를 적절히 가져옴
      const generatedMessage =
        data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (generatedMessage) {
        setGeneratedMessage(generatedMessage);
      } else {
        setGeneratedMessage('생성된 텍스트가 없습니다.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateMessage = () => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    handleGenerateMessage();
  };

  const handleUseMessage = () => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    if (generatedMessage) {
      setActiveTab('image');
      setPurposeContent(generatedMessage);
      setGeneratedMessage(generatedMessage); // generatedMessage도 업데이트
    }
  };

  const handleGenerateImage = async () => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
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
      group: organization,
      base64Image: referenceImage,
    };

    try {
      console.log('Base64 이미지 데이터:', referenceImage);

      const response = await fetch('http://13.239.36.154:8080/api/createImage', {
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
      const imageUrls = data.map((url) => {
        const imageName = url.split('/').pop();
        return `http://13.239.36.154:8080/api/images/${imageName}`;
      });

      setGeneratedImages(imageUrls);

      // 이미지가 있으면 첫 번째 이미지를 자동으로 선택
      if (imageUrls.length > 0) {
        setSelectedImage(imageUrls[0]);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGIF = async () => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    if (gif !== '애니' && !purposeContent) {
      alert('문자 내용을 입력해 주세요.');
      return;
    }

    if (gif === '애니' && (!subject || !action || !location)) {
      alert('피사체, 행동, 장소를 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]); // 이미지 생성 결과를 초기화
    setGeneratedGIFs([]); // GIF 생성 결과를 초기화

    const gifDTO = {
      category: gif,
      message: gif === '애니' ? '' : purposeContent,
      concept: gif === '애니' ? '' : mood,
      group: gif === '애니' ? '' : organization,
      who: gif === '애니' ? subject : '',
      move: gif === '애니' ? action : '',
      where: gif === '애니' ? location : '',
      base64Image: referenceImage,
    };

    try {
      const response = await fetch('http://13.239.36.154:8080/api/createGIF', {
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

      if (data && Array.isArray(data.imageUrl)) {
        setGeneratedGIFs(data.imageUrl); // 모든 GIF URL을 상태로 저장
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
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    setSelectedImage(image);
  };

  const handleSend = async () => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return;
    }
    if (!purposeContent || !selectedImage) {
      alert('문자 내용과 이미지를 선택해주세요.');
      return;
    }

    if (activeTab === 'gif') {
      // GIF 탭에서 선택한 경우 - URL 문자열 그대로 전송
      // const imagename = "C:/Users/USER/Desktop/precapImage/"+selectedImage.split('/').pop();
      const imagename ="/home/ec2-user/app/"+selectedImage.split('/').pop();
      setAiMessage({ purposeContent, selectedImage: null, imagename });
      console.log(purposeContent, imagename)
    } else {
      // 이미지 탭에서 선택한 경우 - URL을 파일로 변환하여 전송
      const imageFile = await urlToFile(selectedImage);
      // setAiMessage({ purposeContent, selectedImage: imageFile });
      const imageName = "/home/ec2-user/app/"+selectedImage.split('/').pop();
      setAiMessage({ purposeContent, selectedImage: imageFile, imageName });
      console.log(purposeContent, selectedImage)
    }

    closePopup();
  };

  const urlToFile = async (url) => {
    if (!isSessionValid()) {
      alert('세션이 유효하지 않습니다. 다시 로그인해주세요.');
      return null;
    }
    const response = await fetch(url); // URL에서 이미지 데이터를 가져옵니다
    const blob = await response.blob(); // Blob으로 변환
    const filename = url.split('/').pop(); // URL에서 파일 이름을 추출

    // Blob을 파일로 변환하여 반환
    return new File([blob], filename, { type: blob.type });
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <span className={activeTab === 'text' ? 'active' : ''} onClick={() => setActiveTab('text')}>
          AI 문자 생성
        </span>
        <span className={activeTab === 'image' ? 'active' : ''} onClick={() => setActiveTab('image')}>
          AI 이미지 생성
        </span>
        <span className={activeTab === 'gif' ? 'active' : ''} onClick={() => setActiveTab('gif')}>
          AI gif 생성
        </span>
        <span onClick={() => closePopup()}>X 닫기</span>
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
                {isGenerating ? (
                  <Lottie animationData={loadingAnimation} loop={true} style={{ width: 150, height: 150 }} />
                ) : (
                  <textarea
                    value={generatedMessage}
                    placeholder="여기에 생성된 결과가 표시됩니다."
                  />
                )}
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
                  onChange={(e) => {
                    setGeneratedMessage(e.target.value);
                    setPurposeContent(e.target.value); 
                  }}
                  placeholder="여기에 문자를 입력하세요."
                />

              </div>

              <div className="input-section">
              <label>조직</label>
              <select
                value={organization}
                onChange={(e) => {
                  if (e.target.value !== '기타') {
                    setOrganization(e.target.value); // 기타가 아니면 선택된 값을 그대로 설정
                    setOtherInfo(''); // 기타 입력 필드를 초기화
                  } else {
                    setOrganization('기타'); // 기타를 선택하면 organization을 기타로 설정
                  }
                }}
              >
                <option value="">선택하세요</option>
                <option value="유치원">유치원</option>
                <option value="교회">교회</option>
                <option value="학교">학교</option>
                <option value="의류 브랜드">의류 브랜드</option>
                <option value="회사">회사</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* "기타"를 선택했을 때만 활성화 */}
            {organization === '기타' && (
              <div className="input-section">
                <label>기타</label>
                <input
                  type="text"
                  value={otherInfo}
                  onChange={(e) => {
                    setOtherInfo(e.target.value); // otherInfo 업데이트
                    
                  }}
                  placeholder="원하는 조직을 입력하세요."
                  disabled={organization !== '기타'} // "기타"가 선택되지 않았으면 비활성화
                  onBlur={() => setOrganization(otherInfo)}
                />
              </div>
            )}

            {/* "기타"를 선택하지 않았을 때 input 비활성화 (보이는 상태 유지) */}
            {organization !== '기타' && (
              <div className="input-section">
                <label>기타</label>
                <input
                  type="text"
                  value={otherInfo}
                  placeholder="기타를 선택하세요."
                  disabled // 비활성화 처리
                />
              </div>
            )}

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
                      <option value="자연">자연</option>
                      <option value="몽환적인">몽환적인</option>
                      <option value="웃긴">웃긴</option>
                      <option value="동화같은">동화같은</option>
                      <option value="팝아트">팝아트</option>
                      <option value="일러스트">일러스트</option>
                      <option value="만화">만화</option>
                    </select>
                  </div>

              <button onClick={handleGenerateImage} disabled={isLoading}>
                {isLoading ? '이미지 생성 중...' : '이미지 생성하기'}
              </button>
            </div>

            <div className="right-section">
              <label>이미지 생성</label>
              {isLoading ? (
                <Lottie animationData={loadingAnimation} loop={true} style={{ width: 150, height: 150 }} />
              ) : generatedImages.length > 0 ? (
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
              <button onClick={handleSend} disabled={!purposeContent}>
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
                      onChange={(e) => {
                        setGeneratedMessage(e.target.value);
                        setPurposeContent(e.target.value); 
                      }}
                      placeholder="여기에 문자를 입력하세요."
                    />
                  </div>

                  <div className="input-section">
              <label>조직</label>
              <select
                value={organization}
                onChange={(e) => {
                  if (e.target.value !== '기타') {
                    setOrganization(e.target.value); // 기타가 아니면 선택된 값을 그대로 설정
                    setOtherInfo(''); // 기타 입력 필드를 초기화
                  } else {
                    setOrganization('기타'); // 기타를 선택하면 organization을 기타로 설정
                  }
                }}
              >
                <option value="">선택하세요</option>
                <option value="유치원">유치원</option>
                <option value="교회">교회</option>
                <option value="학교">학교</option>
                <option value="의류 브랜드">의류 브랜드</option>
                <option value="회사">회사</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* "기타"를 선택했을 때만 활성화 */}
            {organization === '기타' && (
              <div className="input-section">
                <label>기타</label>
                <input
                  type="text"
                  value={otherInfo}
                  onChange={(e) => {
                    setOtherInfo(e.target.value); // otherInfo 업데이트
                    
                  }}
                  placeholder="원하는 조직을 입력하세요."
                  disabled={organization !== '기타'} // "기타"가 선택되지 않았으면 비활성화
                  onBlur={() => setOrganization(otherInfo)}
                />
              </div>
            )}

            {/* "기타"를 선택하지 않았을 때 input 비활성화 (보이는 상태 유지) */}
            {organization !== '기타' && (
              <div className="input-section">
                <label>기타</label>
                <input
                  type="text"
                  value={otherInfo}
                  placeholder="기타를 선택하세요."
                  disabled // 비활성화 처리
                />
              </div>
            )}

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
                      <option value="자연">자연</option>
                      <option value="몽환적인">몽환적인</option>
                      <option value="웃긴">웃긴</option>
                      <option value="동화같은">동화같은</option>
                      <option value="팝아트">팝아트</option>
                      <option value="일러스트">일러스트</option>
                      <option value="만화">만화</option>
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
              {isLoading ? (
                <Lottie animationData={loadingAnimation} loop={true} style={{ width: 150, height: 150 }} />
              ) : generatedGIFs.length > 0 ? (
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
              {/* <button onClick={handleSend} disabled={!selectedImage || !purposeContent}> */}
              <button onClick={() => { setAiMessage({ purposeContent: generatedMessage+"\n"+ "http://13.239.36.154:8080/app/"+selectedImage.split('/').pop()}); closePopup(); }}>
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
