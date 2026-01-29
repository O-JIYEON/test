import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import notFoundAnimation from '../../assets/lottie/notFound.lottie';

function NotFoundPage() {
  return (
    <section className="content" style={{height:'100%'}}>
      <div
        className="content__body"
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <DotLottieReact src={notFoundAnimation} autoplay loop style={{ width: '300px' }} />
        <p>페이지를 찾을 수 없습니다.</p>
      </div>
    </section>
  );
}

export default NotFoundPage;
