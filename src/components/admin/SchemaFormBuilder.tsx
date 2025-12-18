import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, X, Upload } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { FieldDefinition } from '../../utils/sectionSchemas';
import { getFieldValue, setFieldValue, getFieldDefaultValue, validateField, shouldShowField } from '../../utils/sectionSchemas';

interface SchemaFormBuilderProps {
  fields: FieldDefinition[];
  content: any;
  onChange: (content: any) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  isPlatform?: boolean;
  sectionType?: string;
}

export function SchemaFormBuilder({
  fields,
  content,
  onChange,
  onImageUpload,
  isPlatform = false,
  sectionType = '',
}: SchemaFormBuilderProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    const newContent = setFieldValue(content || {}, fieldName, value);
    onChange(newContent);
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: FieldDefinition, value: any) => {
    const validation = validateField(field, value);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [field.name]: validation.error || 'Invalid value' }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: FieldDefinition) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      try {
        const imageUrl = await onImageUpload(file, field.name);
        if (imageUrl) {
          handleFieldChange(field.name, imageUrl);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const renderField = (field: FieldDefinition, depth = 0): React.ReactNode => {
    if (!shouldShowField(field, content)) {
      return null;
    }

    const fieldValue = getFieldValue(content, field.name);
    const fieldError = errors[field.name];
    const indentClass = depth > 0 ? `ml-${depth * 4}` : '';

    switch (field.type) {
      case 'TEXT':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field, fieldValue)}
              placeholder={field.placeholder || ''}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'RICHTEXT':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field, fieldValue)}
              placeholder={field.placeholder || ''}
              rows={field.name.includes('description') || field.name.includes('content') ? 6 : 3}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={fieldValue ?? getFieldDefaultValue(field)}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              onBlur={() => handleFieldBlur(field, fieldValue)}
              placeholder={field.placeholder || ''}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div key={field.id} className={`flex items-center space-x-2 ${indentClass}`}>
            <Checkbox
              id={field.id}
              checked={fieldValue ?? getFieldDefaultValue(field)}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'URL':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="url"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field, fieldValue)}
              placeholder={field.placeholder || 'https://...'}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'IMAGE':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {fieldValue ? (
              <div className="space-y-3">
                <div className="relative">
                  <ImageWithFallback
                    src={fieldValue}
                    alt={field.label}
                    className="w-full h-48 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleFieldChange(field.name, '')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Label htmlFor={`image-${field.id}`} className="cursor-pointer">
                  <span className="text-sm text-gray-500">Click to upload image</span>
                  <Input
                    id={`image-${field.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, field)}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </div>
        );

      case 'DATE':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field, fieldValue)}
              className={fieldError ? 'border-red-500' : ''}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'SELECT':
        return (
          <div key={field.id} className={`space-y-2 ${indentClass}`}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue || field.defaultValue || ''}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              <SelectTrigger id={field.id} className={fieldError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
          </div>
        );

      case 'ARRAY':
        return (
          <ArrayFieldRenderer
            key={field.id}
            field={field}
            content={content}
            onChange={onChange}
            onImageUpload={onImageUpload}
            depth={depth}
            sectionType={sectionType}
          />
        );

      case 'GROUP':
        return (
          <GroupFieldRenderer
            key={field.id}
            field={field}
            content={content}
            onChange={onChange}
            onImageUpload={onImageUpload}
            depth={depth}
          />
        );

      default:
        return null;
    }
  };

  // Sort fields by displayOrder
  const sortedFields = [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="space-y-4">
      {sortedFields.map((field) => renderField(field, 0))}
    </div>
  );
}

// Array Field Renderer Component
function ArrayFieldRenderer({
  field,
  content,
  onChange,
  onImageUpload,
  depth,
  sectionType,
}: {
  field: FieldDefinition;
  content: any;
  onChange: (content: any) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  depth: number;
  sectionType?: string;
}) {
  const arrayValue = getFieldValue(content, field.name) || [];
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const addItem = () => {
    if (!field.nestedFields) return;
    
    const newItem: any = {};
    field.nestedFields.forEach((nestedField) => {
      newItem[nestedField.name] = getFieldDefaultValue(nestedField);
    });
    newItem.id = `item-${Date.now()}`;
    
    const newArray = [...arrayValue, newItem];
    onChange(setFieldValue(content, field.name, newArray));
  };

  const removeItem = (index: number) => {
    const newArray = arrayValue.filter((_: any, i: number) => i !== index);
    onChange(setFieldValue(content, field.name, newArray));
  };

  const updateItem = (index: number, nestedFieldName: string, value: any) => {
    const newArray = [...arrayValue];
    newArray[index] = { ...newArray[index], [nestedFieldName]: value };
    onChange(setFieldValue(content, field.name, newArray));
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.isRepeatable && (
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add {field.label}
          </Button>
        )}
      </div>

      {arrayValue.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>No {field.label.toLowerCase()} yet</p>
          {field.isRepeatable && (
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add First {field.label}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {arrayValue.map((item: any, index: number) => (
            <Card key={item.id || index} className="border-[#E5E5E5]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                    className="flex-1 justify-start"
                  >
                    <span className="font-semibold">
                      {field.label} {index + 1}
                      {item.title && <span className="text-muted-foreground ml-2">- {item.title}</span>}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {expandedItems.has(index) && field.nestedFields && (
                <CardContent className="space-y-4">
                  <SchemaFormBuilder
                    fields={field.nestedFields}
                    content={item}
                    onChange={(newItem) => {
                      const newArray = [...arrayValue];
                      newArray[index] = newItem;
                      onChange(setFieldValue(content, field.name, newArray));
                    }}
                    onImageUpload={onImageUpload ? async (file: File, fieldName: string) => {
                      // Wrap onImageUpload to include the item index
                      // For array fields, we pass the index as a special field name format
                      // The parent handler can parse this to extract the index
                      const fieldNameWithIndex = `${field.name}[${index}].${fieldName}`;
                      console.log(`📸 ArrayFieldRenderer: Wrapping onImageUpload with index ${index}, fieldName=${fieldName}, combined=${fieldNameWithIndex}`);
                      return await onImageUpload(file, fieldNameWithIndex);
                    } : undefined}
                    sectionType={sectionType}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Group Field Renderer Component
function GroupFieldRenderer({
  field,
  content,
  onChange,
  onImageUpload,
  depth,
}: {
  field: FieldDefinition;
  content: any;
  onChange: (content: any) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string | null>;
  depth: number;
}) {
  const groupValue = getFieldValue(content, field.name) || {};

  const handleGroupFieldChange = (nestedFieldName: string, value: any) => {
    const newGroup = { ...groupValue, [nestedFieldName]: value };
    onChange(setFieldValue(content, field.name, newGroup));
  };

  if (!field.nestedFields) return null;

  return (
    <Card className="border-[#E5E5E5]">
      <CardHeader>
        <CardTitle className="text-base">{field.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SchemaFormBuilder
          fields={field.nestedFields}
          content={groupValue}
          onChange={(newGroup) => onChange(setFieldValue(content, field.name, newGroup))}
          onImageUpload={onImageUpload}
        />
      </CardContent>
    </Card>
  );
}

