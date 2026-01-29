import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import notFoundAnimation from '../../assets/lottie/notFound.lottie';
import './notFound.css';

function NotFoundPage() {
  return (
    <section className="content not-found">
      <div className="content__body not-found__body">
        <DotLottieReact src={notFoundAnimation} autoplay loop className="not-found__animation" />
        <p>페이지를 찾을 수 없습니다</p>
      </div>
    </section>
  );
}

export default NotFoundPage;
