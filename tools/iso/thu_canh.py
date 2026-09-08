import bpy, math, mathutils, random
random.seed(3)
# dọn scene mặc định
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 24
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 768, 560
sc.render.film_transparent = False

def mat(ten, mau, nham=0.9):
    m = bpy.data.materials.new(ten); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*mau, 1)
    b.inputs['Roughness'].default_value = nham
    return m

# mặt đất
bpy.ops.mesh.primitive_plane_add(size=40)
dat = bpy.context.object; dat.data.materials.append(mat('dat', (0.42, 0.38, 0.24)))
# lối mòn: một dải phẳng nhô lên tí xíu, màu cát
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.01))
mon = bpy.context.object; mon.scale = (20, 2.6, 0.01)
mon.data.materials.append(mat('mon', (0.66, 0.58, 0.42)))
# hai hàng "cây": nón + trụ, đặt hai bên lối mòn
for i in range(16):
    x = -18 + i * 2.4 + random.uniform(-0.5, 0.5)
    for phia in (-1, 1):
        y = phia * random.uniform(4.2, 7.5)
        h = random.uniform(2.6, 4.4)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=h*0.42, location=(x, y, h*0.21))
        bpy.context.object.data.materials.append(mat(f't{i}{phia}', (0.22, 0.16, 0.11)))
        bpy.ops.mesh.primitive_cone_add(radius1=random.uniform(0.9, 1.4), depth=h,
                                        location=(x, y, h*0.42 + h*0.5))
        bpy.context.object.data.materials.append(mat(f'l{i}{phia}', (0.20, 0.34, 0.16)))
# vài tảng đá trong lòng đường
for i in range(6):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.4,0.7),
        location=(random.uniform(-16,16), random.uniform(-1.8,1.8), 0.25))
    bpy.context.object.data.materials.append(mat(f'd{i}', (0.42,0.40,0.38), 0.95))

# CAMERA TRỰC GIAO, góc isometric thật
cam_d = bpy.data.cameras.new('c'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = 34
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (18, -18, 16)
cam.rotation_euler = (math.radians(54.7), 0, math.radians(45))   # isometric chuẩn

# MẶT TRỜI — có bóng đổ thật
sun_d = bpy.data.lights.new('s', 'SUN'); sun_d.energy = 3.2; sun_d.angle = math.radians(3)
sun = bpy.data.objects.new('sun', sun_d); sc.collection.objects.link(sun)
sun.rotation_euler = (math.radians(48), 0, math.radians(20))
w = bpy.data.worlds.new('w'); w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.45, 0.52, 0.62, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.55
sc.world = w

sc.render.filepath = '/tmp/iso/thu.png'
bpy.ops.render.render(write_still=True)
print('RENDER XONG')
