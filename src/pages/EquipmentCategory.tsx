import { useEffect, useState } from "react";
import { useParams, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SectionsWithManufacturers from "@/components/SectionsWithManufacturers";
import { useCanonical } from "@/hooks/useCanonical";
import apiService, { EquipmentCategoryDetail } from "@/services/api";

interface EquipmentCategoryProps {
  slug?: string;
}

const EquipmentCategory = ({ slug: propSlug }: EquipmentCategoryProps) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [categoryData, setCategoryData] = useState<EquipmentCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get slug from prop, params, or URL pathname
  const actualSlug = propSlug || paramSlug;

  useCanonical(`/equipment/${actualSlug}`);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!actualSlug) {
        setError("No category slug provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getEquipmentCategoryBySlug(actualSlug);
        setCategoryData(data);
        setError(null);
        
        // Update document title and meta description
        document.title = data.meta_title || `${data.name} | Rotational Equipment Services`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && data.meta_description) {
          metaDescription.setAttribute('content', data.meta_description);
        }
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
  }, [actualSlug]);

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