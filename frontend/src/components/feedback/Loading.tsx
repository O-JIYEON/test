import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import loadingAnimation from '../../assets/lottie/loading.lottie';
import './loading.css';

type LoadingProps = {
  message?: string;
};

function Loading({ message = '불러오는 중...' }: LoadingProps) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <DotLottieReact src={loadingAnimation} autoplay loop className="loading__animation" />
      <span className="loading__message">{message}</span>
    </div>
  );
}

export default Loading;
