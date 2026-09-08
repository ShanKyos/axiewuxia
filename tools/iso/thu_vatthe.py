import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.samples=48; sc.cycles.use_denoising=True
sc.render.resolution_x, sc.render.resolution_y = 320, 420
sc.render.film_transparent = True          # nền trong suốt → sprite cắt alpha sẵn
def mat(n,c,r=0.9):
    m=bpy.data.materials.new(n); m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1); b.inputs['Roughness'].default_value=r
    return m
# CÁI CÂY
bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=1.5, location=(0,0,0.75))
bpy.context.object.data.materials.append(mat('than',(0.24,0.17,0.12)))
for i,(rz,z) in enumerate([(1.5,2.0),(1.15,2.9),(0.75,3.6)]):
    bpy.ops.mesh.primitive_cone_add(radius1=rz, depth=1.5, location=(0,0,z))
    bpy.context.object.data.materials.append(mat(f'la{i}',(0.19,0.33,0.15)))
# BẮT BÓNG: mặt đất chỉ nhận bóng, không tự hiện ra
bpy.ops.mesh.primitive_plane_add(size=14)
sh = bpy.context.object
sh.is_shadow_catcher = True
cam_d=bpy.data.cameras.new('c'); cam_d.type='ORTHO'; cam_d.ortho_scale=7
cam=bpy.data.objects.new('cam',cam_d); sc.collection.objects.link(cam); sc.camera=cam
cam.location=(6,-6,5.2); cam.rotation_euler=(math.radians(54.7),0,math.radians(45))
sd=bpy.data.lights.new('s','SUN'); sd.energy=3.4; sd.angle=math.radians(3)
s=bpy.data.objects.new('sun',sd); sc.collection.objects.link(s)
s.rotation_euler=(math.radians(48),0,math.radians(20))
w=bpy.data.worlds.new('w'); w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.45,0.52,0.62,1)
w.node_tree.nodes['Background'].inputs[1].default_value=0.6
sc.world=w
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.render.filepath='/tmp/iso/cay_prop.png'
bpy.ops.render.render(write_still=True)
print('XONG')
