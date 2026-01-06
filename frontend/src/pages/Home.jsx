import React from 'react';
import '../styles/Home.css'; // Import CSS riêng biệt

const Home = () => {
  return (
    <div className="home-container-small-images">
      {/* Hero Section - Vẫn giữ tiêu đề chính */}
      <section className="hero-small-images">
        <div className="hero-content-small-images">
          <span className="subtitle-small-images">Unveiling Serenity</span>
          <h1 className="title-small-images">Holybird <br/> <span>Resort</span></h1>
          <p className="description-small-images">
            Chốn dừng chân lý tưởng, nơi mỗi khoảnh khắc là một kiệt tác của sự thanh bình và đẳng cấp.
          </p>
        </div>
      </section>

      {/* Image Grid Section */}
      <section className="image-grid-section">
        <div className="image-grid">
          {/* Hàng 1 */}
          <div className="grid-item grid-item-large">
            <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1000" alt="Resort View 1" />
            <div className="overlay">Hồ Bơi Vô Cực</div>
          </div>
          <div className="grid-item">
            <img src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=600" alt="Resort View 2" />
            <div className="overlay">Hồ bơi Vô Cực</div>
          </div>
          <div className="grid-item">
            <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=600" alt="Resort View 3" />
            <div className="overlay">Phòng Deluxe</div>
          </div>

          {/* Hàng 2 */}
          <div className="grid-item">
            <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600" alt="Resort View 4" />
            <div className="overlay">Spa Thư Giãn</div>
          </div>
          <div className="grid-item">
            <img src="https://digiticket.vn/blog/wp-content/uploads/2021/07/nha-hang-5-sao-tphcm-13.jpeg?q=80&w=600" alt="Resort View 2" />
            <div className="overlay">Ẩm Thực Fine Dining</div>
          </div>
          <div className="grid-item grid-item-large">
            <img src="https://wedo.vn/wp-content/uploads/2020/04/sanh-khach-san-1.jpg?q=80&w=1000" alt="Resort View 5" />
            <div className="overlay">Sảnh Đón Tiếp</div>
          </div>
          <div className="grid-item">
            <img src="https://tse2.mm.bing.net/th/id/OIP.DvGLAR2brHXJRBTfER6Q2QHaE8?rs=1&pid=ImgDetMain&o=7&rm=3?q=80&w=600" alt="Resort View 6" />
            <div className="overlay">Khu Vui Chơi</div>
          </div>
        </div>
      </section>

      {/* Footer đơn giản */}
      <footer className="footer-small-images">
        <p>© 2026 Holybird Resort - Create by NVC.</p>
      </footer>
    </div>
  );
};

export default Home;