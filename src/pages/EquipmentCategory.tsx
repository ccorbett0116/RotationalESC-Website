import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";
import { useCanonical } from "@/hooks/useCanonical";
import apiService, { EquipmentCategoryDetail } from "@/services/api";

const EquipmentCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categoryData, setCategoryData] = useState<EquipmentCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useCanonical(`/${slug}`);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) {
        setError("No category slug provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getEquipmentCategoryBySlug(slug);
        setCategoryData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching category data:", err);
        if (err.response?.status === 404) {
          setError("Category not found");
        } else {
          setError("Failed to load category data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state (will redirect to 404)
  if (error || !categoryData) {
    return <Navigate to="/404" replace />;
  }

  // Update document title and meta description if provided
  useEffect(() => {
    if (categoryData) {
      document.title = categoryData.meta_title || `${categoryData.name} | Rotational Equipment Services`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && categoryData.meta_description) {
        metaDescription.setAttribute('content', categoryData.meta_description);
      }
    }
  }, [categoryData]);

  return (
    <Layout>
      <SectionsWithManufacturers 
        title={categoryData.name}
        description={categoryData.description}
        page={categoryData.slug}
      />
    </Layout>
  );
};

export default EquipmentCategory;