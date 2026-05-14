// @ts-expect-error - مؤقتاً لتجنب خطأ الـ Import من ملف JS عادي
import CustomerServiceForm from './CustomerServiceForm';
import './App.css';

function App() {
  return (
    <>
      <CustomerServiceForm />
    </>
  );
}

export default App;
