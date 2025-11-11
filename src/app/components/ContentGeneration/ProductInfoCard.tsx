'use client';

import React from 'react';
import Image from 'next/image';
import { ShopeeProductInfo } from '@/app/types';

interface ProductInfoCardProps {
  productInfo: ShopeeProductInfo;
}

export function ProductInfoCard({ productInfo }: ProductInfoCardProps) {
  return (
    <div className="shopee-info-card">
      <div className="card-header">
        <h3>📦 Product Information</h3>
      </div>
      <div className="shopee-info-content">
        <div className="shopee-info-image">
          <Image 
            src={productInfo.image} 
            alt={productInfo.title}
            width={400}
            height={400}
            unoptimized
            className="product-image"
          />
        </div>
        <div className="shopee-info-details">
          <div className="info-field">
            <h4>🏷️ Title</h4>
            <p>{productInfo.title}</p>
          </div>
          <div className="info-field">
            <h4>💰 Price</h4>
            <p className="price-text">{productInfo.price}</p>
          </div>
          <div className="info-field">
            <h4>📄 Description</h4>
            <p>{productInfo.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
